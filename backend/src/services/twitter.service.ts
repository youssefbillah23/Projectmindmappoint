import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncOptions {
  fullSync?: boolean;
  maxPages?: number;
  delayBetweenPages?: number;
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

    // Handle rate limiting
    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset');
      const waitMs = resetTime
        ? Math.max(0, (parseInt(resetTime) * 1000) - Date.now()) + 1000
        : Math.pow(2, attempt + 1) * 1000;

      console.log(`Twitter rate limited. Waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
    }

    // Handle server errors with backoff
    if (response.status >= 500 && attempt < maxRetries) {
      const waitMs = Math.pow(2, attempt + 1) * 1000;
      console.log(`Twitter server error ${response.status}. Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }

    const errorText = await response.text();
    lastError = new Error(`Twitter API ${response.status}: ${errorText}`);
  }

  throw lastError || new Error('Twitter API request failed');
}

export async function fetchBookmarks(
  accessToken: string,
  userId: string,
  options: SyncOptions = {}
): Promise<number> {
  const { fullSync = false, maxPages = 50, delayBetweenPages = 2000 } = options;
  let syncedCount = 0;
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    // Get Twitter user ID
    const meResponse = await fetchWithRateLimit('https://api.twitter.com/2/users/me', headers);
    const meData = (await meResponse.json()) as any;
    const twitterUserId = meData.data.id;

    // Find the most recent bookmark we've synced (for incremental sync)
    let sinceId: string | null = null;
    if (!fullSync) {
      const latestItem = await prisma.savedItem.findFirst({
        where: { userId, platform: Platform.TWITTER },
        orderBy: { savedAt: 'desc' },
        select: { externalId: true },
      });
      sinceId = latestItem?.externalId || null;
    }

    let paginationToken: string | undefined;
    let pageCount = 0;
    let reachedExisting = false;

    do {
      // Build URL with pagination
      let url = `https://api.twitter.com/2/users/${twitterUserId}/bookmarks?max_results=100&tweet.fields=created_at,text,entities,author_id,public_metrics&expansions=author_id&user.fields=name,username,profile_image_url`;

      if (paginationToken) {
        url += `&pagination_token=${paginationToken}`;
      }

      // Check remaining rate limit before request
      const response = await fetchWithRateLimit(url, headers);

      // Log rate limit status
      const remaining = response.headers.get('x-rate-limit-remaining');
      const resetTime = response.headers.get('x-rate-limit-reset');
      if (remaining) {
        console.log(`Twitter rate limit remaining: ${remaining}, resets at: ${resetTime}`);

        // If running low, pause proactively
        if (parseInt(remaining) <= 2 && resetTime) {
          const waitMs = Math.max(0, (parseInt(resetTime) * 1000) - Date.now()) + 1000;
          console.log(`Rate limit low. Pausing for ${Math.round(waitMs / 1000)}s`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }

      const data = (await response.json()) as any;
      const tweets: any[] = data.data || [];
      const users: any[] = data.includes?.users || [];

      if (tweets.length === 0) break;

      const usersMap = new Map<string, any>();
      for (const user of users) {
        usersMap.set(user.id, user);
      }

      for (const tweet of tweets) {
        // For incremental sync: stop if we reach content we already have
        if (sinceId && tweet.id === sinceId) {
          reachedExisting = true;
          break;
        }

        const externalId = tweet.id;
        const author = usersMap.get(tweet.author_id);
        const authorName = author ? `@${author.username}` : '';
        const title = authorName
          ? `${authorName}: ${tweet.text.slice(0, 100)}`
          : tweet.text.slice(0, 100);
        const body = tweet.text;
        const tweetUrl = `https://twitter.com/i/web/status/${tweet.id}`;
        const mediaUrl = tweet.entities?.urls?.[0]?.expanded_url || null;
        const savedAt = tweet.created_at ? new Date(tweet.created_at) : new Date();

        await prisma.savedItem.upsert({
          where: {
            userId_externalId: { userId, externalId },
          },
          update: {
            title,
            body,
            url: tweetUrl,
            mediaUrl,
            syncedAt: new Date(),
          },
          create: {
            userId,
            platform: Platform.TWITTER,
            externalId,
            contentType: 'tweet',
            title,
            body,
            url: tweetUrl,
            mediaUrl,
            topicTags: [],
            savedAt,
            syncedAt: new Date(),
          },
        });

        syncedCount++;
      }

      if (reachedExisting) {
        console.log(`Incremental sync: reached existing content after ${syncedCount} new items`);
        break;
      }

      // Check for next page
      paginationToken = data.meta?.next_token;
      pageCount++;

      // Leisurely pace between pages
      if (paginationToken && pageCount < maxPages) {
        console.log(`Twitter sync: page ${pageCount} done, ${syncedCount} items so far. Waiting ${delayBetweenPages / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenPages));
      }

    } while (paginationToken && pageCount < maxPages);

    console.log(`Twitter sync complete: ${syncedCount} items across ${pageCount} pages`);
  } catch (err) {
    console.error('Twitter fetchBookmarks error:', err);
    throw err;
  }

  return syncedCount;
}
