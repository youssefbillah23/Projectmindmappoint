import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { generateBriefing } from '../services/briefing.service';

const prisma = new PrismaClient();
const router = Router();

// GET /briefings/today - Get today's briefing with stories
router.get('/today', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const briefing = await prisma.briefing.findFirst({
      where: {
        userId: req.user!.id,
        date: today,
      },
      include: {
        stories: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!briefing) {
      res.json({ briefing: null, message: 'No briefing available for today' });
      return;
    }

    res.json({ briefing });
  } catch (err) {
    console.error('Get today briefing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /briefings/:id - Get specific briefing
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const briefing = await prisma.briefing.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        stories: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!briefing) {
      res.status(404).json({ error: 'Briefing not found' });
      return;
    }

    res.json({ briefing });
  } catch (err) {
    console.error('Get briefing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /briefings - List all briefings (paginated)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [briefings, total] = await Promise.all([
      prisma.briefing.findMany({
        where: { userId: req.user!.id },
        include: {
          stories: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              summaryShort: true,
              topicTag: true,
              relevanceScore: true,
              position: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.briefing.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      briefings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List briefings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /briefings/generate - Manually trigger briefing generation
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.briefing.findFirst({
      where: {
        userId,
        date: today,
        status: { in: ['GENERATING', 'READY'] },
      },
    });

    if (existing && existing.status === 'GENERATING') {
      res.json({ message: 'Briefing is already being generated', briefingId: existing.id });
      return;
    }

    const briefing = await generateBriefing(userId);
    res.status(201).json({ briefing });
  } catch (err) {
    console.error('Generate briefing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
