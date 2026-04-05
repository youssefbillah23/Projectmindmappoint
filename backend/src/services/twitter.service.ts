import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

export async function fetchBookmarks(
  accessToken: string,
  userId: string
): Promise<number> {
  let syncedCount = 0;

  try {
    // Fetch bookmarks from Twitter API v2
    // First get the authenticated user's ID
    const meResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error('Twitter users/me error:', meResponse.status, errorText);
      throw new Error(`Twitter API returned ${meResponse.status}`);
    }

    const meData = (await meResponse.json()) as any;
    const twitterUserId = meData.data.id;

    // Fetch bookmarks with expansions for full tweet data
    const bookmarksResponse = await fetch(
      `https://api.twitter.com/2/users/${twitterUserId}/bookmarks?max_results=100&tweet.fields=created_at,text,entities,author_id&expansions=author_id&user.fields=name,username`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!bookmarksResponse.ok) {
      const errorText = await bookmarksResponse.text();
      console.error('Twitter bookmarks error:', bookmarksResponse.status, errorText);
      throw new Error(`Twitter bookmarks API returned ${bookmarksResponse.status}`);
    }

    const bookmarksData = (await bookmarksResponse.json()) as any;
    const tweets: any[] = bookmarksData.data || [];
    const users: any[] = bookmarksData.includes?.users || [];

    const usersMap = new Map<string, any>();
    for (const user of users) {
      usersMap.set(user.id, user);
    }

    for (const tweet of tweets) {
      const externalId = tweet.id;
      const author = usersMap.get(tweet.author_id);
      const authorName = author ? `@${author.username}` : '';
      const title = authorName
        ? `${authorName}: ${tweet.text.slice(0, 100)}`
        : tweet.text.slice(0, 100);
      const body = tweet.text;
      const url = `https://twitter.com/i/web/status/${tweet.id}`;

      // Extract media URL from entities if present
      const mediaUrl = tweet.entities?.urls?.[0]?.expanded_url || null;

      const savedAt = tweet.created_at ? new Date(tweet.created_at) : new Date();

      await prisma.savedItem.upsert({
        where: {
          userId_externalId: { userId, externalId },
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
          platform: Platform.TWITTER,
          externalId,
          contentType: 'tweet',
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
  } catch (err) {
    console.error('Twitter fetchBookmarks error:', err);
    throw err;
  }

  return syncedCount;
}
