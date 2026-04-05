import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTION_SCORES: Record<string, number> = {
  EXPAND: 3,
  LISTEN: 2,
  SAVE: 5,
  SHARE: 4,
  SKIP: -2,
};

const DECAY_FACTOR = 0.95;

export async function updateInterestGraph(
  userId: string,
  action: string,
  topicTags: string[]
): Promise<void> {
  const scoreChange = ACTION_SCORES[action] ?? 0;

  if (scoreChange === 0 || topicTags.length === 0) {
    return;
  }

  for (const topic of topicTags) {
    const normalizedTopic = topic.toLowerCase().trim();
    if (!normalizedTopic) continue;

    await prisma.interestGraph.upsert({
      where: {
        userId_topic: { userId, topic: normalizedTopic },
      },
      update: {
        score: { increment: scoreChange },
        interactionCount: { increment: 1 },
        lastUpdated: new Date(),
      },
      create: {
        userId,
        topic: normalizedTopic,
        score: Math.max(0, scoreChange),
        interactionCount: 1,
        lastUpdated: new Date(),
      },
    });
  }
}

export async function getTopInterests(
  userId: string,
  limit: number = 20
): Promise<Array<{ topic: string; score: number; interactionCount: number }>> {
  const interests = await prisma.interestGraph.findMany({
    where: {
      userId,
      score: { gt: 0 },
    },
    orderBy: { score: 'desc' },
    take: limit,
    select: {
      topic: true,
      score: true,
      interactionCount: true,
      lastUpdated: true,
    },
  });

  return interests;
}

export async function decayOldSignals(userId: string): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get all interests that haven't been updated in the last day
  const staleInterests = await prisma.interestGraph.findMany({
    where: {
      userId,
      lastUpdated: { lt: oneDayAgo },
      score: { gt: 0 },
    },
  });

  for (const interest of staleInterests) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - interest.lastUpdated.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Apply decay factor for each day since last update
    const decayedScore = interest.score * Math.pow(DECAY_FACTOR, daysSinceUpdate);

    // If score is negligible, set to 0
    const finalScore = decayedScore < 0.01 ? 0 : decayedScore;

    await prisma.interestGraph.update({
      where: { id: interest.id },
      data: { score: finalScore },
    });
  }
}
