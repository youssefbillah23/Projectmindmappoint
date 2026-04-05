import { Router } from 'express';
import { PrismaClient, Platform } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { syncPlatform, syncAllPlatforms } from '../services/sync.service';

const prisma = new PrismaClient();
const router = Router();

function platformToEnum(platform: string): Platform | null {
  const map: Record<string, Platform> = {
    linkedin: Platform.LINKEDIN,
    twitter: Platform.TWITTER,
    instagram: Platform.INSTAGRAM,
  };
  return map[platform.toLowerCase()] ?? null;
}

// GET /platforms - List user's connected platforms
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const connections = await prisma.platformConnection.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        platform: true,
        expiresAt: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ platforms: connections });
  } catch (err) {
    console.error('List platforms error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /platforms/:platform/sync - Trigger manual sync
router.post('/:platform/sync', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const platformStr = req.params.platform;

    if (platformStr === 'all') {
      await syncAllPlatforms(req.user!.id);
      res.json({ message: 'All platforms synced' });
      return;
    }

    const platformEnum = platformToEnum(platformStr);
    if (!platformEnum) {
      res.status(400).json({ error: `Unsupported platform: ${platformStr}` });
      return;
    }

    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: { userId: req.user!.id, platform: platformEnum },
      },
    });

    if (!connection) {
      res.status(404).json({ error: `Platform ${platformStr} not connected` });
      return;
    }

    await syncPlatform(req.user!.id, platformStr);

    res.json({ message: `${platformStr} sync started` });
  } catch (err) {
    console.error('Platform sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /platforms/:platform - Disconnect platform
router.delete('/:platform', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const platformEnum = platformToEnum(req.params.platform);
    if (!platformEnum) {
      res.status(400).json({ error: `Unsupported platform: ${req.params.platform}` });
      return;
    }

    await prisma.platformConnection.deleteMany({
      where: {
        userId: req.user!.id,
        platform: platformEnum,
      },
    });

    res.json({ message: `${req.params.platform} disconnected` });
  } catch (err) {
    console.error('Disconnect platform error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
