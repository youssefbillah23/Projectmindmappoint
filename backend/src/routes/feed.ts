import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const PLATFORM_MAP: Record<string, string> = {
  linkedin: 'LINKEDIN',
  twitter: 'TWITTER',
  instagram: 'INSTAGRAM',
};

// GET /feed - Get unified saved items feed
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const sort = (req.query.sort as string) || 'date';
    const search = req.query.search as string | undefined;
    const platformFilter = req.query.platform as string | undefined;
    const topicFilter = req.query.topic as string | undefined;

    const where: any = { userId: req.user!.id };

    if (platformFilter) {
      const p = PLATFORM_MAP[platformFilter.toLowerCase()];
      if (p) where.platform = p;
    }

    if (topicFilter) {
      where.topicTags = { has: topicFilter };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { summaryShort: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort === 'relevance' && search
      ? { createdAt: 'desc' as const }
      : { savedAt: 'desc' as const };

    const [items, total] = await Promise.all([
      prisma.savedItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          platform: true,
          externalId: true,
          contentType: true,
          title: true,
          body: true,
          url: true,
          mediaUrl: true,
          topicTags: true,
          summaryShort: true,
          summaryLong: true,
          savedAt: true,
          syncedAt: true,
          createdAt: true,
        },
      }),
      prisma.savedItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
