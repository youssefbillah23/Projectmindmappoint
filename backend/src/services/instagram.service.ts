import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncOptions {
  fullSync?: boolean;
  maxPages?: number;
  delayBetweenPages?: number;
}

async function fetchWithRateLimit(
  url: string,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url);

    if (response.ok) {
      return response;
    }

    // Handle rate limiting (Instagram uses 429 or error code 4 in JSON)
    if (response.status === 429) {
      const waitMs = Math.pow(2, attempt + 1) * 1000;
      console.log(`Instagram rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
    }

    // Handle server errors with backoff
    if (response.status >= 500 && attempt < maxRetries) {
      const waitMs = Math.pow(2, attempt + 1) * 1000;
      console.log(`Instagram server error ${response.status}. Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }

    const errorText = await response.text();

    // Instagram sometimes returns 200 with an error object
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.code === 4 && attempt < maxRetries) {
        // Application-level rate limit
        const waitMs = Math.pow(2, attempt + 1) * 2000;
        console.log(`Instagram app rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
    } catch {
      // Not JSON, fall through
    }

    lastError = new Error(`Instagram API ${response.status}: ${errorText}`);
  }

  throw lastError || new Error('Instagram API request failed');
}

export async function fetchSavedPosts(
  accessToken: string,
  userId: string,
  options: SyncOptions = {}
): Promise<number> {
  const { fullSync = false, maxPages = 30, delayBetweenPages = 2000 } = options;
  let syncedCount = 0;

  try {
    // Determine incremental sync cutoff
    let lastSyncedAt: Date | null = null;
    if (!fullSync) {
      const latestItem = await prisma.savedItem.findFirst({
        where: { userId, platform: Platform.INSTAGRAM },
        orderBy: { savedAt: 'desc' },
        select: { savedAt: true },
      });
      lastSyncedAt = latestItem?.savedAt || null;
    }

    // Instagram Graph API uses cursor-based pagination with 'after' cursors
    let nextUrl: string | null =
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}&limit=50`;

    let pageCount = 0;
    let reachedExisting = false;

    while (nextUrl && pageCount < maxPages) {
      const response = await fetchWithRateLimit(nextUrl);

      const data = (await response.json()) as any;

      // Check for application-level rate limiting in response body
      if (data.error) {
        if (data.error.code === 4) {
          console.log('Instagram app rate limit hit in response. Waiting 60s...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue; // Retry same page
        }
        throw new Error(`Instagram API error: ${data.error.message}`);
      }

      const posts: any[] = data.data || [];

      if (posts.length === 0) break;

      for (const post of posts) {
        // For incremental sync: check if we've passed the cutoff
        const postTimestamp = post.timestamp ? new Date(post.timestamp) : new Date();
        if (lastSyncedAt && postTimestamp <= lastSyncedAt) {
          reachedExisting = true;
          break;
        }

        const externalId = post.id;
        const caption = post.caption || '';
        const title = caption.slice(0, 200) || `Instagram ${post.media_type || 'post'}`;
        const body = caption;
        const url = post.permalink || null;
        const mediaUrl = post.media_url || post.thumbnail_url || null;
        const savedAt = postTimestamp;
        const contentType = (post.media_type || 'IMAGE').toLowerCase();

        await prisma.savedItem.upsert({
          where: {
            userId_externalId: { userId, externalId },
          },
          update: {
            title,
            body,
            url,
            mediaUrl,
            contentType,
            syncedAt: new Date(),
          },
          create: {
            userId,
            platform: Platform.INSTAGRAM,
            externalId,
            contentType,
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
        console.log(`Instagram incremental sync: reached existing content after ${syncedCount} new items`);
        break;
      }

      // Instagram cursor-based pagination: use paging.next URL directly
      nextUrl = data.paging?.next || null;
      pageCount++;

      // Leisurely pace between pages
      if (nextUrl && pageCount < maxPages) {
        console.log(`Instagram sync: page ${pageCount} done, ${syncedCount} items so far. Waiting ${delayBetweenPages / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
      }
    }

    console.log(`Instagram sync complete: ${syncedCount} items across ${pageCount} pages`);
  } catch (err) {
    console.error('Instagram fetchSavedPosts error:', err);
    throw err;
  }

  return syncedCount;
}
