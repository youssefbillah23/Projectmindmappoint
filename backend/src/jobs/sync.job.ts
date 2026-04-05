import { Worker } from 'bullmq';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { syncAllPlatforms, syncPlatform } from '../services/sync.service';
import { syncQueue, redisConnection } from './queue';

const prisma = new PrismaClient();

// BullMQ Worker that processes platform sync jobs
export const syncWorker = new Worker(
  'sync',
  async (job) => {
    const { userId, platform } = job.data;

    try {
      if (platform) {
        console.log(`Syncing ${platform} for user ${userId}`);
        const count = await syncPlatform(userId, platform);
        console.log(`Synced ${count} items from ${platform} for user ${userId}`);
        return { syncedCount: count, platform };
      } else {
        console.log(`Syncing all platforms for user ${userId}`);
        await syncAllPlatforms(userId);
        return { status: 'completed' };
      }
    } catch (err) {
      console.error(`Sync failed for user ${userId}:`, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

syncWorker.on('completed', (job) => {
  console.log(`Sync job ${job.id} completed`);
});

syncWorker.on('failed', (job, err) => {
  console.error(`Sync job ${job?.id} failed:`, err.message);
});

// Cron: every 6 hours, sync all users' platforms
export function startSyncCron(): void {
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log('Starting scheduled platform sync for all users');

      const users = await prisma.user.findMany({
        where: {
          platformConnections: {
            some: {},
          },
        },
        select: { id: true },
      });

      for (const user of users) {
        await syncQueue.add(
          'sync-all-platforms',
          { userId: user.id },
          {
            jobId: `sync-${user.id}-${Date.now()}`,
          }
        );
      }

      console.log(`Queued sync jobs for ${users.length} users`);
    } catch (err) {
      console.error('Sync cron error:', err);
    }
  });

  console.log('Platform sync cron job started (every 6 hours)');
}
