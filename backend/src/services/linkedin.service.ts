import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncOptions {
  fullSync?: boolean;
  maxPages?: number;
  delayBetweenPages?: number;
}

interface LinkedInSavedPost {
  id: string;
  title?: string;
  commentary?: string;
  url?: string;
  mediaUrl?: string;
  savedAt?: string;
}

async function fetchWithRateLimit(
  url: string,
  headers: Record<string, string>,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, { headers });

    if (response.ok) {
      return response;
    }

    // Handle rate limiting (LinkedIn uses 429 with retry-after header)
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.pow(2, attempt + 1) * 1000;

      console.log(`LinkedIn rate limited. Waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
    }

    // Handle server errors with backoff
    if (response.status >= 500 && attempt < maxRetries) {
      const waitMs = Math.pow(2, attempt + 1) * 1000;
      console.log(`LinkedIn server error ${response.status}. Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }

    const errorText = await response.text();
    lastError = new Error(`LinkedIn API ${response.status}: ${errorText}`);
  }

  throw lastError || new Error('LinkedIn API request failed');
}

export async function fetchSavedContent(
  accessToken: string,
  userId: string,
  options: SyncOptions = {}
): Promise<number> {
  const { fullSync = false, maxPages = 30, delayBetweenPages = 2000 } = options;
  let syncedCount = 0;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': '202304',
  };

  try {
    // Determine incremental sync cutoff
    let lastSyncedAt: Date | null = null;
    if (!fullSync) {
      const latestItem = await prisma.savedItem.findFirst({
        where: { userId, platform: Platform.LINKEDIN },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      });
      lastSyncedAt = latestItem?.syncedAt || null;
    }

    let start = 0;
    const count = 50;
    let pageCount = 0;
    let reachedExisting = false;

    do {
      // LinkedIn uses start/count offset-based pagination
      const url = `https://api.linkedin.com/v2/savedItems?q=criteria&count=${count}&start=${start}`;

      const response = await fetchWithRateLimit(url, headers);

      // Log rate limit status if available
      const remaining = response.headers.get('x-rate-limit-remaining');
      if (remaining) {
        console.log(`LinkedIn rate limit remaining: ${remaining}`);

        if (parseInt(remaining) <= 2) {
          const retryAfter = response.headers.get('retry-after');
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          console.log(`LinkedIn rate limit low. Pausing for ${Math.round(waitMs / 1000)}s`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }

      const data = (await response.json()) as any;
      const elements: any[] = data.elements || [];

      if (elements.length === 0) break;

      for (const element of elements) {
        const externalId = element.savedEntity || element.id || `li_${Date.now()}_${Math.random()}`;
        const post = element.savedEntityContent || {};

        // For incremental sync: check if we've already synced this item
        const savedAtRaw = element.savedAt;
        const savedAt = savedAtRaw ? new Date(savedAtRaw) : new Date();

        if (lastSyncedAt && savedAt <= lastSyncedAt) {
          reachedExisting = true;
          break;
        }

        const title =
          post.title ||
          (post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '')
            .slice(0, 200) ||
          null;

        const body =
          post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text ||
          post.commentary ||
          null;

        const url = post.originalUrl || post.contentUrl || null;

        const mediaContent =
          post.specificContent?.['com.linkedin.ugc.ShareContent']?.media?.[0];
        const mediaUrl = mediaContent?.originalUrl || mediaContent?.thumbnails?.[0]?.url || null;

        await prisma.savedItem.upsert({
          where: {
            userId_externalId: { userId, externalId: String(externalId) },
          },
          update: {
            title,
            body,
            url,
            mediaUrl,
            syncedAt: new Date(),
          },
          create: {
            userId,
            platform: Platform.LINKEDIN,
            externalId: String(externalId),
            contentType: 'post',
            title,
            body,
            url,
            mediaUrl,
            topicTags: [],
            savedAt,
            syncedAt: new Date(),
          },
        });

        syncedCount++;
      }

      if (reachedExisting) {
        console.log(`LinkedIn incremental sync: reached existing content after ${syncedCount} new items`);
        break;
      }

      // Move to the next page
      start += elements.length;
      pageCount++;

      // Stop if we got fewer than requested (last page)
      if (elements.length < count) break;

      // Leisurely pace between pages
      if (pageCount < maxPages) {
        console.log(`LinkedIn sync: page ${pageCount} done, ${syncedCount} items so far. Waiting ${delayBetweenPages / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
      }

    } while (pageCount < maxPages);

    console.log(`LinkedIn sync complete: ${syncedCount} items across ${pageCount} pages`);
  } catch (err) {
    console.error('LinkedIn fetchSavedContent error:', err);
    throw err;
  }

  return syncedCount;
}
