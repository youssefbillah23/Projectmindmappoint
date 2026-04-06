import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  semanticSearch,
  askKnowledgeBase,
  indexAllUserContent,
  generateUserInsights,
} from '../services/knowledge.service';

const router = Router();

// POST /knowledge/search - Semantic search across saved content
router.post('/search', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { query, limit = 10 } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    const results = await semanticSearch(req.user!.id, query, Math.min(limit, 20));
    res.json({ results });
  } catch (err) {
    console.error('Semantic search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /knowledge/ask - Ask a question about your saved content
router.post('/ask', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }
    const result = await askKnowledgeBase(req.user!.id, question);
    res.json(result);
  } catch (err) {
    console.error('Knowledge base error:', err);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// POST /knowledge/index - Trigger indexing of all user content
router.post('/index', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const count = await indexAllUserContent(req.user!.id);
    res.json({ indexed: count, message: `Indexed ${count} items` });
  } catch (err) {
    console.error('Indexing error:', err);
    res.status(500).json({ error: 'Indexing failed' });
  }
});

// GET /knowledge/insights - Get AI-generated insights about your interests
router.get('/insights', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const insights = await generateUserInsights(req.user!.id);
    res.json(insights);
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
