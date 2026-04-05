import dotenv from 'dotenv';
dotenv.config();

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(env('PORT', '3001'), 10),
  frontendUrl: env('FRONTEND_URL', 'http://localhost:3000'),

  jwt: {
    secret: env('JWT_SECRET', 'dev-jwt-secret'),
    refreshSecret: env('JWT_REFRESH_SECRET', 'dev-jwt-refresh-secret'),
    expiresIn: '15m' as const,
    refreshExpiresIn: '7d' as const,
  },

  db: {
    url: env('DATABASE_URL', 'postgresql://localhost:5432/pulsepoint'),
  },

  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
  },

  encryption: {
    key: env('ENCRYPTION_KEY', '0'.repeat(64)),
  },

  linkedin: {
    clientId: env('LINKEDIN_CLIENT_ID', ''),
    clientSecret: env('LINKEDIN_CLIENT_SECRET', ''),
    callbackUrl: env('LINKEDIN_CALLBACK_URL', 'http://localhost:3001/api/oauth/linkedin/callback'),
  },

  twitter: {
    clientId: env('TWITTER_CLIENT_ID', ''),
    clientSecret: env('TWITTER_CLIENT_SECRET', ''),
    callbackUrl: env('TWITTER_CALLBACK_URL', 'http://localhost:3001/api/oauth/twitter/callback'),
  },

  instagram: {
    clientId: env('INSTAGRAM_CLIENT_ID', ''),
    clientSecret: env('INSTAGRAM_CLIENT_SECRET', ''),
    callbackUrl: env('INSTAGRAM_CALLBACK_URL', 'http://localhost:3001/api/oauth/instagram/callback'),
  },

  openai: {
    apiKey: env('OPENAI_API_KEY', ''),
  },

  elevenlabs: {
    apiKey: env('ELEVENLABS_API_KEY', ''),
  },

  newsApi: {
    key: env('NEWS_API_KEY', ''),
  },

  s3: {
    bucket: env('S3_BUCKET', 'pulsepoint-assets'),
    accessKeyId: env('S3_ACCESS_KEY_ID', ''),
    secretAccessKey: env('S3_SECRET_ACCESS_KEY', ''),
    region: env('S3_REGION', 'us-east-1'),
  },
};

export default config;
