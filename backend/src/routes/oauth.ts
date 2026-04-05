import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient, Platform } from '@prisma/client';
import { config } from '../config';
import { encrypt } from '../utils/encryption';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// In-memory store for PKCE verifiers (Twitter OAuth 2.0 PKCE)
// In production, use Redis or a session store
const pkceStore = new Map<string, string>();

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sha256(buffer: string): Buffer {
  return crypto.createHash('sha256').update(buffer).digest();
}

function buildLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.callbackUrl,
    state,
    scope: 'openid profile email w_member_social r_liteprofile',
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

function buildTwitterAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.twitter.clientId,
    redirect_uri: config.twitter.callbackUrl,
    state,
    scope: 'tweet.read users.read bookmark.read offline.access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

function buildInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.instagram.clientId,
    redirect_uri: config.instagram.callbackUrl,
    state,
    scope: 'user_profile,user_media',
    response_type: 'code',
  });
  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

function platformToEnum(platform: string): Platform | null {
  const map: Record<string, Platform> = {
    linkedin: Platform.LINKEDIN,
    twitter: Platform.TWITTER,
    instagram: Platform.INSTAGRAM,
  };
  return map[platform.toLowerCase()] ?? null;
}

// GET /oauth/:platform/connect
router.get('/:platform/connect', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { platform } = req.params;
  const userId = req.user!.id;
  const state = `${userId}:${crypto.randomBytes(16).toString('hex')}`;

  switch (platform.toLowerCase()) {
    case 'linkedin': {
      const url = buildLinkedInAuthUrl(state);
      res.redirect(url);
      break;
    }
    case 'twitter': {
      const codeVerifier = base64URLEncode(crypto.randomBytes(32));
      const codeChallenge = base64URLEncode(sha256(codeVerifier));
      pkceStore.set(state, codeVerifier);
      // Clean up after 10 minutes
      setTimeout(() => pkceStore.delete(state), 10 * 60 * 1000);
      const url = buildTwitterAuthUrl(state, codeChallenge);
      res.redirect(url);
      break;
    }
    case 'instagram': {
      const url = buildInstagramAuthUrl(state);
      res.redirect(url);
      break;
    }
    default:
      res.status(400).json({ error: `Unsupported platform: ${platform}` });
  }
});

// GET /oauth/:platform/callback
router.get('/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state parameter' });
    return;
  }

  const stateStr = state as string;
  const userId = stateStr.split(':')[0];

  if (!userId) {
    res.status(400).json({ error: 'Invalid state parameter' });
    return;
  }

  const platformEnum = platformToEnum(platform);
  if (!platformEnum) {
    res.status(400).json({ error: `Unsupported platform: ${platform}` });
    return;
  }

  try {
    let accessToken: string;
    let refreshToken: string | null = null;
    let expiresAt: Date | null = null;
    let scopes: string | null = null;

    switch (platform.toLowerCase()) {
      case 'linkedin': {
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: config.linkedin.callbackUrl,
            client_id: config.linkedin.clientId,
            client_secret: config.linkedin.clientSecret,
          }),
        });
        const tokenData = await tokenRes.json() as any;
        if (!tokenRes.ok) {
          throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');
        }
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token ?? null;
        if (tokenData.expires_in) {
          expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        }
        scopes = tokenData.scope ?? null;
        break;
      }

      case 'twitter': {
        const codeVerifier = pkceStore.get(stateStr);
        if (!codeVerifier) {
          res.status(400).json({ error: 'PKCE verifier not found. Please try connecting again.' });
          return;
        }
        pkceStore.delete(stateStr);

        const basicAuth = Buffer.from(`${config.twitter.clientId}:${config.twitter.clientSecret}`).toString('base64');
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: config.twitter.callbackUrl,
            code_verifier: codeVerifier,
          }),
        });
        const tokenData = await tokenRes.json() as any;
        if (!tokenRes.ok) {
          throw new Error(tokenData.error_description || 'Twitter token exchange failed');
        }
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token ?? null;
        if (tokenData.expires_in) {
          expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        }
        scopes = tokenData.scope ?? null;
        break;
      }

      case 'instagram': {
        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.instagram.clientId,
            client_secret: config.instagram.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: config.instagram.callbackUrl,
            code: code as string,
          }),
        });
        const tokenData = await tokenRes.json() as any;
        if (!tokenRes.ok) {
          throw new Error(tokenData.error_message || 'Instagram token exchange failed');
        }
        accessToken = tokenData.access_token;

        // Exchange short-lived token for long-lived token
        const longLivedRes = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${config.instagram.clientSecret}&access_token=${tokenData.access_token}`
        );
        const longLivedData = await longLivedRes.json() as any;
        if (longLivedRes.ok && longLivedData.access_token) {
          accessToken = longLivedData.access_token;
          if (longLivedData.expires_in) {
            expiresAt = new Date(Date.now() + longLivedData.expires_in * 1000);
          }
        }
        break;
      }

      default:
        res.status(400).json({ error: `Unsupported platform: ${platform}` });
        return;
    }

    // Encrypt tokens before storing
    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

    await prisma.platformConnection.upsert({
      where: {
        userId_platform: { userId, platform: platformEnum },
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt,
        scopes,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform: platformEnum,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt,
        scopes,
      },
    });

    res.redirect(`${config.frontendUrl}/settings/connections?connected=${platform}`);
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    res.redirect(`${config.frontendUrl}/settings/connections?error=${platform}`);
  }
});

export default router;
