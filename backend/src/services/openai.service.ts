import OpenAI from 'openai';
import { config } from '../config';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function generateSummary(
  content: string
): Promise<{ short: string; long: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a concise summarizer. Given content, produce two summaries: a short one (1-2 sentences, max 150 characters) and a long one (2-3 paragraphs). Return valid JSON with keys "short" and "long".',
      },
      {
        role: 'user',
        content: `Summarize the following content:\n\n${content.slice(0, 4000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 1000,
  });

  const text = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(text);

  return {
    short: parsed.short || content.slice(0, 150),
    long: parsed.long || content.slice(0, 1000),
  };
}

export async function classifyTopics(content: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a topic classifier. Given content, identify 1-5 relevant topic tags. Return valid JSON with a key "topics" containing an array of lowercase topic strings. Examples: "ai", "startups", "marketing", "web-development", "finance", "health", "design".',
      },
      {
        role: 'user',
        content: `Classify the following content into topics:\n\n${content.slice(0, 3000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 200,
  });

  const text = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed.topics)) {
    return parsed.topics.map((t: any) => String(t).toLowerCase().trim()).filter(Boolean);
  }

  return [];
}

export async function generatePost(
  content: string,
  platform: 'linkedin' | 'twitter' | 'instagram',
  tone: string
): Promise<string> {
  const platformGuidelines: Record<string, string> = {
    linkedin:
      'LinkedIn post: Professional tone, can use paragraphs, up to 3000 characters. Use line breaks for readability. Can include relevant hashtags at the end.',
    twitter:
      'Twitter/X post: Concise, max 280 characters. Punchy and engaging. Can include 1-2 hashtags.',
    instagram:
      'Instagram caption: Engaging, can be longer. Use emojis sparingly. Include relevant hashtags (5-10) at the end separated by line breaks.',
  };

  const toneDescriptions: Record<string, string> = {
    professional: 'Professional and authoritative. Data-driven where possible.',
    casual: 'Casual and conversational. Approachable and friendly.',
    bold: 'Bold and provocative. Strong opinions. Attention-grabbing.',
    educational: 'Educational and informative. Teaching-oriented with clear takeaways.',
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a social media content writer. Generate a post for the specified platform and tone. Return only the post text, nothing else.\n\nPlatform: ${platformGuidelines[platform]}\nTone: ${toneDescriptions[tone] || tone}`,
      },
      {
        role: 'user',
        content: `Create a ${platform} post based on this content. Tone: ${tone}.\n\nSource content:\n${content.slice(0, 3000)}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}
