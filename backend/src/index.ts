import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import authRouter from './routes/auth';
import oauthRouter from './routes/oauth';
import platformsRouter from './routes/platforms';
import briefingRouter from './routes/briefing';
import libraryRouter from './routes/library';
import postsRouter from './routes/posts';
import feedRouter from './routes/feed';
import interactionsRouter from './routes/interactions';
import knowledgeRouter from './routes/knowledge';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve audio files
app.use('/audio', express.static(path.join('/tmp', 'audio')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/briefings', briefingRouter);
app.use('/api/library', libraryRouter);
app.use('/api/posts', postsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/knowledge', knowledgeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`PulsePoint API running on port ${PORT}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});

// Initialize cron jobs (lazy import to avoid errors if Redis not available)
if (process.env.NODE_ENV !== 'test') {
  import('./jobs/queue').then(({ initializeCronJobs }) => {
    if (initializeCronJobs) {
      initializeCronJobs();
      console.log('Cron jobs initialized');
    }
  }).catch((err) => {
    console.warn('Could not initialize cron jobs (Redis may not be available):', err.message);
  });
}

export default app;
