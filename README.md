# PulsePoint

AI-powered social saves aggregator and content studio. Connects LinkedIn, X (Twitter), and Instagram — pulls all your bookmarks and saves into one unified feed, generates personalized daily briefings with AI summaries and audio narration, and creates platform-specific content drafts.

## Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Node.js 20, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Cache/Queue**: Redis + BullMQ
- **AI**: OpenAI (summaries, tagging, post generation), ElevenLabs (text-to-speech)
- **Storage**: S3/R2 for audio files

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 1. Clone and install

```bash
git clone https://github.com/youssefbillah23/projectmindmappoint.git
cd projectmindmappoint

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and database URL
```

### 3. Set up database

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

App runs at http://localhost:5173. API at http://localhost:3001.

### Demo Account

After seeding: `demo@pulsepoint.app` / `demo123456`

## Docker

```bash
docker-compose up -d
```

## API Keys Required

| Service | Purpose | URL |
|---------|---------|-----|
| LinkedIn | OAuth + saved posts | developer.linkedin.com |
| X/Twitter | OAuth + bookmarks | developer.twitter.com |
| Instagram | OAuth + saved posts | developers.facebook.com |
| OpenAI | Summaries, tagging, posts | platform.openai.com |
| ElevenLabs | Text-to-speech audio | elevenlabs.io |
| NewsAPI | Fresh headlines | newsapi.org |

## Features

- **Unified Saves Feed** — All bookmarks from LinkedIn, X, Instagram in one place
- **AI Daily Briefing** — Personalized 8-12 story briefing based on your interests
- **Stories-Style Navigation** — Tap/swipe through briefings like Instagram Stories
- **Listen Mode** — AI-narrated audio for every story
- **Interest Engine** — Learns what you care about from your interactions
- **Content Studio** — Generate platform-specific post drafts from any story
- **Save for Later** — Personal reading/listening queue

## Deployment

- **Frontend**: Deploy to Vercel (`vercel.json` included)
- **Backend**: Deploy to Railway or Render (`Dockerfile` included)
- **Database**: Supabase (PostgreSQL) or any managed PostgreSQL
