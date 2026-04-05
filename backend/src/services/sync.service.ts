import { PrismaClient, Platform } from '@prisma/client';
import { decrypt } from '../utils/encryption';
import { fetchSavedContent } from './linkedin.service';
import { fetchBookmarks } from './twitter.service';
import { fetchSavedPosts } from './instagram.service';
import { classifyTopics } from './openai.service';

const prisma = new PrismaClient();

export async function syncPlatform(
  userId: string,
  platform: string
): Promise<number> {
  const platformEnum = platform.toUpperCase() as Platform;

  const connection = await prisma.platformConnection.findUnique({
    where: {
      userId_platform: { userId, platform: platformEnum },
    },
  });

  if (!connection) {
    throw new Error(`No ${platform} connection found for user ${userId}`);
  }

  // Decrypt the access token
  const accessToken = decrypt(connection.accessToken);

  let syncedCount = 0;

  // Call the appropriate platform service
  switch (platformEnum) {
    case Platform.LINKEDIN:
      syncedCount = await fetchSavedContent(accessToken, userId);
      break;
    case Platform.TWITTER:
      syncedCount = await fetchBookmarks(accessToken, userId);
      break;
    case Platform.INSTAGRAM:
      syncedCount = await fetchSavedPosts(accessToken, userId);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Run topic tagging on items that don't have tags yet
  const untaggedItems = await prisma.savedItem.findMany({
    where: {
      userId,
      platform: platformEnum,
      topicTags: { isEmpty: true },
    },
    take: 50,
  });

  for (const item of untaggedItems) {
    const content = [item.title, item.body, item.summaryShort]
      .filter(Boolean)
      .join('\n');

    if (!content.trim()) continue;

    try {
      const topics = await classifyTopics(content);
      await prisma.savedItem.update({
        where: { id: item.id },
        data: { topicTags: topics },
      });
    } catch (err) {
      console.error(`Topic classification failed for item ${item.id}:`, err);
    }
  }

  return syncedCount;
}

export async function syncAllPlatforms(userId: string): Promise<void> {
  const connections = await prisma.platformConnection.findMany({
    where: { userId },
    select: { platform: true },
  });

  const results = await Promise.allSettled(
    connections.map((conn) =>
      syncPlatform(userId, conn.platform.toLowerCase())
    )
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const platform = connections[i].platform;
    if (result.status === 'rejected') {
      console.error(`Sync failed for ${platform}:`, result.reason);
    } else {
      console.log(`Synced ${result.value} items from ${platform}`);
    }
  }
}
