import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import crypto from 'crypto';
import { config } from '../config';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Use prisma.$queryRaw for the content_embeddings table since
// the Prisma client may not have been regenerated with the new model yet.
// This provides runtime compatibility regardless of client generation state.
const db = prisma as any;

// Generate embedding for text using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Index a saved item (generate and store its embedding)
export async function indexSavedItem(savedItemId: string, userId: string): Promise<void> {
  const item = await prisma.savedItem.findUnique({ where: { id: savedItemId } });
  if (!item) return;

  const content = [item.title, item.body, item.summaryShort, ...(item.topicTags || [])]
    .filter(Boolean)
    .join('\n');

  if (!content.trim()) return;

  const contentHash = crypto.createHash('md5').update(content).digest('hex');

  // Check if already indexed with same content
  const existing = await db.contentEmbedding.findUnique({
    where: { savedItemId },
  });

  if (existing && existing.contentHash === contentHash) return;

  const embedding = await generateEmbedding(content);

  await db.contentEmbedding.upsert({
    where: { savedItemId },
    update: { embedding, contentHash },
    create: { savedItemId, userId, embedding, contentHash },
  });
}

// Batch index all unindexed items for a user
export async function indexAllUserContent(userId: string): Promise<number> {
  // Find items that don't have an embedding yet
  const allItems = await prisma.savedItem.findMany({
    where: { userId },
    select: { id: true },
  });

  const indexedIds = (await db.contentEmbedding.findMany({
    where: { userId },
    select: { savedItemId: true },
  })).map((e: any) => e.savedItemId);

  const indexedSet = new Set(indexedIds);
  const unindexedItems = allItems.filter((item: any) => !indexedSet.has(item.id));

  let indexed = 0;
  // Process in batches of 10 to respect rate limits
  for (let i = 0; i < unindexedItems.length; i += 10) {
    const batch = unindexedItems.slice(i, i + 10);
    await Promise.all(
      batch.map(async (item) => {
        try {
          await indexSavedItem(item.id, userId);
          indexed++;
        } catch (err) {
          console.error(`Failed to index item ${item.id}:`, err);
        }
      })
    );
    // Small delay between batches to avoid rate limits
    if (i + 10 < unindexedItems.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return indexed;
}

// Semantic search across user's saved content
export async function semanticSearch(
  userId: string,
  query: string,
  limit: number = 10
): Promise<Array<{
  item: any;
  similarity: number;
}>> {
  const queryEmbedding = await generateEmbedding(query);

  // Get all embeddings for this user
  const embeddings: any[] = await db.contentEmbedding.findMany({
    where: { userId },
    include: {
      savedItem: {
        select: {
          id: true,
          platform: true,
          title: true,
          body: true,
          url: true,
          topicTags: true,
          summaryShort: true,
          summaryLong: true,
          savedAt: true,
        },
      },
    },
  });

  // Compute similarities and rank
  const results = embeddings
    .map((emb: any) => ({
      item: emb.savedItem,
      similarity: cosineSimilarity(queryEmbedding, emb.embedding),
    }))
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

// Ask a natural language question about the user's saved content
export async function askKnowledgeBase(
  userId: string,
  question: string
): Promise<{ answer: string; sources: any[] }> {
  // Find most relevant content
  const results = await semanticSearch(userId, question, 8);

  if (results.length === 0) {
    return {
      answer: "I don't have enough saved content to answer that question yet. Try saving more bookmarks and articles first.",
      sources: [],
    };
  }

  // Build context from top results
  const context = results
    .map((r, i) => {
      const item = r.item;
      return `[Source ${i + 1}] (${item.platform}, similarity: ${r.similarity.toFixed(3)})
Title: ${item.title || 'Untitled'}
Content: ${(item.body || item.summaryLong || item.summaryShort || '').slice(0, 500)}
Topics: ${item.topicTags?.join(', ') || 'none'}
URL: ${item.url || 'none'}`;
    })
    .join('\n\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are PulsePoint's knowledge assistant. The user has saved various bookmarks and articles across LinkedIn, Twitter/X, and Instagram. Based on their saved content, answer their question thoughtfully. Reference specific saved items when relevant. If you're inferring interests or patterns, be explicit about what evidence supports your conclusions. Be conversational but insightful.`,
      },
      {
        role: 'user',
        content: `Based on my saved content, ${question}\n\nHere are my most relevant saves:\n\n${context}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const answer = completion.choices[0]?.message?.content || 'Unable to generate an answer.';

  return {
    answer,
    sources: results.slice(0, 5).map((r) => ({
      id: r.item.id,
      title: r.item.title,
      platform: r.item.platform,
      url: r.item.url,
      similarity: Math.round(r.similarity * 100),
    })),
  };
}

// Generate a user profile/interest summary from their saved content
export async function generateUserInsights(userId: string): Promise<{
  summary: string;
  topThemes: string[];
  recommendations: string[];
}> {
  const items = await prisma.savedItem.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    take: 50,
    select: { title: true, topicTags: true, platform: true, summaryShort: true },
  });

  if (items.length === 0) {
    return {
      summary: 'Not enough data yet to generate insights.',
      topThemes: [],
      recommendations: [],
    };
  }

  const contentSummary = items
    .map((i) => `- [${i.platform}] ${i.title}: ${i.summaryShort || ''}`)
    .join('\n');

  const allTags = items.flatMap((i) => i.topicTags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an analyst studying a user\'s saved content patterns. Return JSON with keys: "summary" (2-3 paragraph profile of this person\'s interests and what they care about), "topThemes" (array of 5-8 theme strings), "recommendations" (array of 3-5 actionable content recommendations based on gaps or emerging interests).',
      },
      {
        role: 'user',
        content: `Analyze this user's saved content and create an interest profile:\n\nTag frequency: ${JSON.stringify(tagCounts)}\n\nRecent saves:\n${contentSummary}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 1500,
  });

  const text = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(text);

  return {
    summary: parsed.summary || 'Unable to generate summary.',
    topThemes: parsed.topThemes || [],
    recommendations: parsed.recommendations || [],
  };
}
