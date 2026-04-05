import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateInterestGraph, getTopInterests } from '../services/interest.service';

const prisma = new PrismaClient();
const router = Router();

const interactionSchema = z.object({
  storyId: z.string().uuid().optional(),
  savedItemId: z.string().uuid().optional(),
  action: z.enum(['EXPAND', 'SKIP', 'LISTEN', 'SAVE', 'SHARE']),
}).refine((data) => data.storyId || data.savedItemId, {
  message: 'Either storyId or savedItemId is required',
});

// POST /interactions - Record user interaction
router.post('/', authenticateToken, validate(interactionSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId, savedItemId, action } = req.body;
    const userId = req.user!.id;

    const interaction = await prisma.userInteraction.create({
      data: {
        userId,
        storyId: storyId || null,
        savedItemId: savedItemId || null,
        action,
      },
    });

    // Gather topic tags from the interacted item to update interest graph
    let topicTags: string[] = [];

    if (storyId) {
      const story = await prisma.briefingStory.findUnique({
        where: { id: storyId },
        select: { topicTag: true },
      });
      if (story?.topicTag) {
        topicTags = [story.topicTag];
      }
    }

    if (savedItemId) {
      const item = await prisma.savedItem.findUnique({
        where: { id: savedItemId },
        select: { topicTags: true },
      });
      if (item?.topicTags) {
        topicTags = [...topicTags, ...item.topicTags];
      }
    }

    if (topicTags.length > 0) {
      await updateInterestGraph(userId, action, topicTags);
    }

    res.status(201).json({ interaction });
  } catch (err) {
    console.error('Record interaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /interests - Get user's interest graph (top topics)
router.get('/interests', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const interests = await getTopInterests(req.user!.id, limit);
    res.json({ interests });
  } catch (err) {
    console.error('Get interests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /interests/:topic - Pin or mute a topic
router.patch('/interests/:topic', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { topic } = req.params;
    const { pinned, muted } = req.body;
    const userId = req.user!.id;

    const existing = await prisma.interestGraph.findUnique({
      where: { userId_topic: { userId, topic } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Topic not found in interest graph' });
      return;
    }

    let newScore = existing.score;

    // Pinning boosts the score significantly so it stays at the top
    if (pinned === true) {
      newScore = Math.max(newScore, 100);
    }

    // Muting sets score to a large negative value
    if (muted === true) {
      newScore = -1000;
    }

    // Unmuting restores to a neutral score
    if (muted === false && existing.score < 0) {
      newScore = 0;
    }

    const updated = await prisma.interestGraph.update({
      where: { userId_topic: { userId, topic } },
      data: {
        score: newScore,
        lastUpdated: new Date(),
      },
    });

    res.json({ interest: updated });
  } catch (err) {
    console.error('Update interest error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
