import { config } from '../config';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

export async function fetchNews(topics: string[]): Promise<NewsArticle[]> {
  if (topics.length === 0) {
    return [];
  }

  const articles: NewsArticle[] = [];

  // Build a query from topics, combining with OR for broader results
  const query = topics.slice(0, 5).join(' OR ');

  try {
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '20',
      apiKey: config.newsApi.key,
    });

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      console.error('NewsAPI error:', response.status, errorData.message);
      throw new Error(`NewsAPI returned ${response.status}: ${errorData.message}`);
    }

    const data = (await response.json()) as any;
    const rawArticles: any[] = data.articles || [];

    for (const article of rawArticles) {
      if (!article.title || article.title === '[Removed]') {
        continue;
      }

      articles.push({
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
      });
    }
  } catch (err) {
    console.error('fetchNews error:', err);
    throw err;
  }

  return articles;
}
