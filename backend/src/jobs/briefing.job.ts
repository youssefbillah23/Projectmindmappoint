import { Worker } from 'bullmq';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { generateBriefing } from '../services/briefing.service';
import { briefingQueue, redisConnection } from './queue';

const prisma = new PrismaClient();

// BullMQ Worker that processes briefing generation jobs
export const briefingWorker = new Worker(
  'briefing',
  async (job) => {
    const { userId } = job.data;
    console.log(`Processing briefing generation for user ${userId}`);

    try {
      const briefing = await generateBriefing(userId);
      console.log(`Briefing ${briefing.id} generated for user ${userId}`);
      return { briefingId: briefing.id, status: 'completed' };
    } catch (err) {
      console.error(`Briefing generation failed for user ${userId}:`, err);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

briefingWorker.on('completed', (job) => {
  console.log(`Briefing job ${job.id} completed`);
});

briefingWorker.on('failed', (job, err) => {
  console.error(`Briefing job ${job?.id} failed:`, err.message);
});

// Cron schedule: check every minute for users needing briefings at their configured time
export function startBriefingCron(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;

      // Find users whose briefingTime matches the current time
      const users = await prisma.user.findMany({
        where: {
          briefingTime: currentTime,
        },
        select: { id: true },
      });

      if (users.length === 0) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const user of users) {
        // Check if a briefing already exists for today
        const existing = await prisma.briefing.findFirst({
          where: {
            userId: user.id,
            date: today,
          },
        });

        if (existing) continue;

        // Add briefing generation job to the queue
        await briefingQueue.add(
          'generate-briefing',
          { userId: user.id },
          {
            jobId: `briefing-${user.id}-${today.toISOString().split('T')[0]}`,
          }
        );

        console.log(`Queued briefing generation for user ${user.id}`);
      }
    } catch (err) {
      console.error('Briefing cron error:', err);
    }
  });

  console.log('Briefing cron job started');
}
