import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const prisma = new PrismaClient();
const router = Router();

const addLibraryItemSchema = z.object({
  storyId: z.string().uuid().optional(),
  savedItemId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
}).refine((data) => data.storyId || data.savedItemId, {
  message: 'Either storyId or savedItemId is required',
});

const updateLibraryItemSchema = z.object({
  tags: z.array(z.string()).optional(),
  done: z.boolean().optional(),
});

// GET /library - List library items
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const tagsFilter = req.query.tags ? (req.query.tags as string).split(',') : undefined;

    const where: any = { userId: req.user!.id };

    if (tagsFilter && tagsFilter.length > 0) {
      where.tags = { hasSome: tagsFilter };
    }

    const [items, total] = await Promise.all([
      prisma.libraryItem.findMany({
        where,
        include: {
          story: {
            select: {
              id: true,
              title: true,
              summaryShort: true,
              sourceUrl: true,
              topicTag: true,
            },
          },
          savedItem: {
            select: {
              id: true,
              title: true,
              summaryShort: true,
              url: true,
              platform: true,
              topicTags: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.libraryItem.count({ where }),
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
    console.error('List library error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /library - Add item to library
router.post('/', authenticateToken, validate(addLibraryItemSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { storyId, savedItemId, tags } = req.body;

    const item = await prisma.libraryItem.create({
      data: {
        userId: req.user!.id,
        storyId: storyId || null,
        savedItemId: savedItemId || null,
        tags: tags || [],
      },
      include: {
        story: {
          select: { id: true, title: true, summaryShort: true },
        },
        savedItem: {
          select: { id: true, title: true, summaryShort: true },
        },
      },
    });

    res.status(201).json({ item });
  } catch (err) {
    console.error('Add library item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /library/:id - Update tags, mark done
router.patch('/:id', authenticateToken, validate(updateLibraryItemSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.libraryItem.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Library item not found' });
      return;
    }

    const updateData: any = {};
    if (req.body.tags !== undefined) {
      updateData.tags = req.body.tags;
    }
    if (req.body.done !== undefined) {
      updateData.doneAt = req.body.done ? new Date() : null;
    }

    const item = await prisma.libraryItem.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        story: {
          select: { id: true, title: true, summaryShort: true },
        },
        savedItem: {
          select: { id: true, title: true, summaryShort: true },
        },
      },
    });

    res.json({ item });
  } catch (err) {
    console.error('Update library item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /library/:id - Remove from library
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.libraryItem.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Library item not found' });
      return;
    }

    await prisma.libraryItem.delete({ where: { id: req.params.id } });

    res.json({ message: 'Library item removed' });
  } catch (err) {
    console.error('Delete library item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
