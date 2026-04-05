import { PrismaClient } from '@prisma/client';
import { getTopInterests } from './interest.service';
import { fetchNews } from './news.service';
import { generateSummary } from './openai.service';
import { generateAudio } from './elevenlabs.service';

const prisma = new PrismaClient();

interface StoryCandidate {
  title: string;
  body: string;
  sourceUrl: string | null;
  topicTag: string;
  relevanceScore: number;
  source: 'saved' | 'news';
}

export async function generateBriefing(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create briefing record in GENERATING state
  const briefing = await prisma.briefing.create({
    data: {
      userId,
      date: today,
      status: 'GENERATING',
    },
  });

  try {
    // 1. Get user's interest graph
    const interests = await getTopInterests(userId, 15);
    const topTopics = interests.map((i) => i.topic);
    const topicScores = new Map(interests.map((i) => [i.topic, i.score]));

    // 2. Pull top saved items matching interests
    const savedItems = await prisma.savedItem.findMany({
      where: {
        userId,
        topicTags: { hasSome: topTopics.length > 0 ? topTopics : ['general'] },
      },
      orderBy: { savedAt: 'desc' },
      take: 30,
    });

    const candidates: StoryCandidate[] = [];

    for (const item of savedItems) {
      const matchingTopics = item.topicTags.filter((t) => topicScores.has(t));
      const bestTopic = matchingTopics.sort(
        (a, b) => (topicScores.get(b) || 0) - (topicScores.get(a) || 0)
      )[0] || item.topicTags[0] || 'general';

      const relevanceScore = matchingTopics.reduce(
        (sum, t) => sum + (topicScores.get(t) || 0),
        0
      );

      candidates.push({
        title: item.title || item.body?.slice(0, 100) || 'Untitled',
        body: item.body || item.summaryLong || item.summaryShort || item.title || '',
        sourceUrl: item.url,
        topicTag: bestTopic,
        relevanceScore,
        source: 'saved',
      });
    }

    // 3. Pull fresh news via news service matching interests
    if (topTopics.length > 0) {
      try {
        const newsArticles = await fetchNews(topTopics.slice(0, 5));

        for (const article of newsArticles) {
          // Find which topic this article best matches
          const articleText = `${article.title} ${article.description}`.toLowerCase();
          let bestTopic = topTopics[0] || 'news';
          let bestScore = 0;

          for (const topic of topTopics) {
            if (articleText.includes(topic)) {
              const score = topicScores.get(topic) || 0;
              if (score > bestScore) {
                bestScore = score;
                bestTopic = topic;
              }
            }
          }

          candidates.push({
            title: article.title,
            body: `${article.title}\n\n${article.description}\n\nSource: ${article.source}`,
            sourceUrl: article.url,
            topicTag: bestTopic,
            relevanceScore: bestScore * 0.8, // Slight penalty for news vs saved
            source: 'news',
          });
        }
      } catch (err) {
        console.error('News fetch failed, continuing with saved items only:', err);
      }
    }

    // 4. Score and select top 8-12 stories
    candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Deduplicate by topic - ensure variety
    const selectedCandidates: StoryCandidate[] = [];
    const topicCounts = new Map<string, number>();

    for (const candidate of candidates) {
      if (selectedCandidates.length >= 12) break;

      const topicCount = topicCounts.get(candidate.topicTag) || 0;
      // Allow max 3 stories per topic
      if (topicCount >= 3) continue;

      selectedCandidates.push(candidate);
      topicCounts.set(candidate.topicTag, topicCount + 1);
    }

    // If we have fewer than 8 stories, add remaining regardless of topic limits
    if (selectedCandidates.length < 8) {
      for (const candidate of candidates) {
        if (selectedCandidates.length >= 8) break;
        if (!selectedCandidates.includes(candidate)) {
          selectedCandidates.push(candidate);
        }
      }
    }

    // 5. For each story: generate summaries and audio
    const stories = [];
    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];

      let summaryShort = candidate.body.slice(0, 150);
      let summaryLong = candidate.body;

      try {
        const summaries = await generateSummary(candidate.body);
        summaryShort = summaries.short;
        summaryLong = summaries.long;
      } catch (err) {
        console.error('Summary generation failed for story, using fallback:', err);
      }

      // Create the story record first to get its ID for audio
      const story = await prisma.briefingStory.create({
        data: {
          briefingId: briefing.id,
          title: candidate.title,
          summaryShort,
          summaryLong,
          sourceUrl: candidate.sourceUrl,
          topicTag: candidate.topicTag,
          relevanceScore: candidate.relevanceScore,
          position: i + 1,
        },
      });

      // Generate audio
      let audioUrl: string | null = null;
      try {
        const audioText = `${candidate.title}. ${summaryLong}`;
        audioUrl = await generateAudio(audioText, story.id);
      } catch (err) {
        console.error('Audio generation failed for story, skipping:', err);
      }

      if (audioUrl) {
        await prisma.briefingStory.update({
          where: { id: story.id },
          data: { audioUrl },
        });
      }

      stories.push({ ...story, audioUrl });
    }

    // 6. Update briefing status to READY
    const updatedBriefing = await prisma.briefing.update({
      where: { id: briefing.id },
      data: { status: 'READY' },
      include: {
        stories: { orderBy: { position: 'asc' } },
      },
    });

    return updatedBriefing;
  } catch (err) {
    // On failure, mark briefing as failed by keeping GENERATING status
    console.error('Briefing generation failed:', err);
    throw err;
  }
}
