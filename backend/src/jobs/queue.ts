import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null,
});

export const briefingQueue = new Queue('briefing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const syncQueue = new Queue('sync', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export { connection as redisConnection };

export function initializeCronJobs(): void {
  // Import dynamically to avoid circular dependencies
  const { startBriefingCron } = require('./briefing.job');
  const { startSyncCron } = require('./sync.job');

  startBriefingCron();
  startSyncCron();
}
