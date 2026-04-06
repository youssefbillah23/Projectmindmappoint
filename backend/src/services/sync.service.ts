import { PrismaClient, Platform } from '@prisma/client';
import { decrypt } from '../utils/encryption';
import { fetchSavedContent } from './linkedin.service';
import { fetchBookmarks } from './twitter.service';
import { fetchSavedPosts } from './instagram.service';
import { classifyTopics } from './openai.service';
import { indexAllUserContent } from './knowledge.service';

const prisma = new PrismaClient();

const TOPIC_BATCH_SIZE = 5;
const TOPIC_BATCH_DELAY_MS = 1500;

interface SyncResult {
  platform: string;
  itemsSynced: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

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

  // Determine if this is the first sync (no items exist yet = full sync)
  const existingCount = await prisma.savedItem.count({
    where: { userId, platform: platformEnum },
  });
  const isFirstSync = existingCount === 0;
  const syncOptions = { fullSync: isFirstSync };

  let syncedCount = 0;

  // Call the appropriate platform service with sync options
  switch (platformEnum) {
    case Platform.LINKEDIN:
      syncedCount = await fetchSavedContent(accessToken, userId, syncOptions);
      break;
    case Platform.TWITTER:
      syncedCount = await fetchBookmarks(accessToken, userId, syncOptions);
      break;
    case Platform.INSTAGRAM:
      syncedCount = await fetchSavedPosts(accessToken, userId, syncOptions);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  // Run topic tagging on items that don't have tags yet, in small batches
  await classifyUntaggedItems(userId, platformEnum);

  return syncedCount;
}

async function classifyUntaggedItems(
  userId: string,
  platform: Platform
): Promise<void> {
  const untaggedItems = await prisma.savedItem.findMany({
    where: {
      userId,
      platform,
      topicTags: { isEmpty: true },
    },
  });

  if (untaggedItems.length === 0) return;

  console.log(`Classifying ${untaggedItems.length} untagged items in batches of ${TOPIC_BATCH_SIZE}`);

  for (let i = 0; i < untaggedItems.length; i += TOPIC_BATCH_SIZE) {
    const batch = untaggedItems.slice(i, i + TOPIC_BATCH_SIZE);

    for (const item of batch) {
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
        // Continue with remaining items rather than failing entirely
      }
    }

    // Delay between batches to avoid OpenAI rate limits
    if (i + TOPIC_BATCH_SIZE < untaggedItems.length) {
      console.log(`Topic classification: batch done (${Math.min(i + TOPIC_BATCH_SIZE, untaggedItems.length)}/${untaggedItems.length}). Waiting ${TOPIC_BATCH_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, TOPIC_BATCH_DELAY_MS));
    }
  }

  console.log(`Topic classification complete for ${untaggedItems.length} items`);
}

export async function syncAllPlatforms(userId: string): Promise<SyncResult[]> {
  const connections = await prisma.platformConnection.findMany({
    where: { userId },
    select: { platform: true },
  });

  const results: SyncResult[] = [];

  // Sync platforms sequentially to be gentle on resources and rate limits
  for (const conn of connections) {
    const platformName = conn.platform.toLowerCase();
    try {
      const itemsSynced = await syncPlatform(userId, platformName);
      results.push({
        platform: conn.platform,
        itemsSynced,
        status: 'success',
      });
      console.log(`Synced ${itemsSynced} items from ${conn.platform}`);
    } catch (err: any) {
      // Check if partial progress was saved (items were synced before error)
      const recentlySynced = await prisma.savedItem.count({
        where: {
          userId,
          platform: conn.platform,
          syncedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (recentlySynced > 0) {
        console.error(`Partial sync for ${conn.platform}: ${recentlySynced} items saved before error:`, err.message);
        results.push({
          platform: conn.platform,
          itemsSynced: recentlySynced,
          status: 'partial',
          error: err.message,
        });
      } else {
        console.error(`Sync failed for ${conn.platform}:`, err.message);
        results.push({
          platform: conn.platform,
          itemsSynced: 0,
          status: 'failed',
          error: err.message,
        });
      }
    }
  }

  // Auto-trigger knowledge base indexing after sync completes
  const totalSynced = results.reduce((sum, r) => sum + r.itemsSynced, 0);
  if (totalSynced > 0) {
    try {
      console.log(`Sync complete. Indexing knowledge base for user ${userId}...`);
      const indexed = await indexAllUserContent(userId);
      console.log(`Knowledge base indexed: ${indexed} items`);
    } catch (err: any) {
      console.error('Knowledge base indexing failed after sync:', err.message);
      // Don't fail the sync results because of indexing failure
    }
  }

  return results;
}
