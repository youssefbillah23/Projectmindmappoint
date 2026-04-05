import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

interface LinkedInSavedPost {
  id: string;
  title?: string;
  commentary?: string;
  url?: string;
  mediaUrl?: string;
  savedAt?: string;
}

export async function fetchSavedContent(
  accessToken: string,
  userId: string
): Promise<number> {
  let syncedCount = 0;

  try {
    // Fetch saved posts from LinkedIn API v2
    // LinkedIn uses the savedPosts endpoint under the ugcPosts umbrella
    const response = await fetch(
      'https://api.linkedin.com/v2/savedItems?q=criteria&count=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202304',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn API error:', response.status, errorText);
      throw new Error(`LinkedIn API returned ${response.status}`);
    }

    const data = (await response.json()) as any;
    const elements: any[] = data.elements || [];

    for (const element of elements) {
      const externalId = element.savedEntity || element.id || `li_${Date.now()}_${Math.random()}`;
      const post = element.savedEntityContent || {};

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

      const savedAt = element.savedAt ? new Date(element.savedAt) : new Date();

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
  } catch (err) {
    console.error('LinkedIn fetchSavedContent error:', err);
    throw err;
  }

  return syncedCount;
}
