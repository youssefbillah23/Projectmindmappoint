import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

export async function fetchSavedPosts(
  accessToken: string,
  userId: string
): Promise<number> {
  let syncedCount = 0;

  try {
    // Fetch saved posts from Instagram Graph API
    // First get the user's media with saved collection
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${accessToken}&limit=50`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram API error:', response.status, errorText);
      throw new Error(`Instagram API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    const posts: any[] = data.data || [];

    for (const post of posts) {
      const externalId = post.id;
      const caption = post.caption || '';
      const title = caption.slice(0, 200) || `Instagram ${post.media_type || 'post'}`;
      const body = caption;
      const url = post.permalink || null;
      const mediaUrl = post.media_url || post.thumbnail_url || null;
      const savedAt = post.timestamp ? new Date(post.timestamp) : new Date();

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
  } catch (err) {
    console.error('Instagram fetchSavedPosts error:', err);
    throw err;
  }

  return syncedCount;
}
