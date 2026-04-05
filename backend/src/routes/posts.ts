import { Router } from 'express';
import { PrismaClient, Platform } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generatePost } from '../services/openai.service';

const prisma = new PrismaClient();
const router = Router();

const generatePostSchema = z.object({
  sourceItemId: z.string(),
  tone: z.enum(['professional', 'casual', 'bold', 'educational']),
});

const updatePostSchema = z.object({
  draftText: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'POSTED']).optional(),
});

// POST /posts/generate - Generate post drafts for all 3 platforms
router.post('/generate', authenticateToken, validate(generatePostSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { sourceItemId, tone } = req.body;
    const userId = req.user!.id;

    // Try to find the source content from saved items or briefing stories
    let sourceContent = '';
    let sourceTitle = '';

    const savedItem = await prisma.savedItem.findFirst({
      where: { id: sourceItemId, userId },
    });

    if (savedItem) {
      sourceContent = savedItem.body || savedItem.summaryLong || savedItem.summaryShort || savedItem.title || '';
      sourceTitle = savedItem.title || '';
    } else {
      const story = await prisma.briefingStory.findFirst({
        where: { id: sourceItemId },
        include: { briefing: true },
      });

      if (story && story.briefing.userId === userId) {
        sourceContent = story.summaryLong || story.summaryShort || story.title;
        sourceTitle = story.title;
      }
    }

    if (!sourceContent) {
      res.status(404).json({ error: 'Source item not found or has no content' });
      return;
    }

    const platforms: Array<'linkedin' | 'twitter' | 'instagram'> = ['linkedin', 'twitter', 'instagram'];
    const platformEnumMap: Record<string, Platform> = {
      linkedin: Platform.LINKEDIN,
      twitter: Platform.TWITTER,
      instagram: Platform.INSTAGRAM,
    };

    const drafts = await Promise.all(
      platforms.map(async (platform) => {
        const draftText = await generatePost(sourceContent, platform, tone);
        return prisma.generatedPost.create({
          data: {
            userId,
            sourceItemId,
            platform: platformEnumMap[platform],
            draftText,
            tone,
          },
        });
      })
    );

    res.status(201).json({ posts: drafts });
  } catch (err) {
    console.error('Generate posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /posts - List generated posts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user!.id };

    if (req.query.platform) {
      const platformMap: Record<string, Platform> = {
        linkedin: Platform.LINKEDIN,
        twitter: Platform.TWITTER,
        instagram: Platform.INSTAGRAM,
      };
      const p = platformMap[(req.query.platform as string).toLowerCase()];
      if (p) where.platform = p;
    }

    if (req.query.status) {
      where.status = (req.query.status as string).toUpperCase();
    }

    const [posts, total] = await Promise.all([
      prisma.generatedPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.generatedPost.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /posts/:id - Update draft text, schedule
router.patch('/:id', authenticateToken, validate(updatePostSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.generatedPost.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const updateData: any = {};
    if (req.body.draftText !== undefined) updateData.draftText = req.body.draftText;
    if (req.body.scheduledAt !== undefined) updateData.scheduledAt = new Date(req.body.scheduledAt);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const post = await prisma.generatedPost.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ post });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /posts/:id - Delete post
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.generatedPost.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    await prisma.generatedPost.delete({ where: { id: req.params.id } });

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
