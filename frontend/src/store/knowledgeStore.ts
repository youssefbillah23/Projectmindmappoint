import { create } from 'zustand'
import { api } from '../lib/api'

interface SearchResult {
  item: {
    id: string
    platform: string
    title: string
    body: string
    url: string
    topicTags: string[]
    summaryShort: string
    savedAt: string
  }
  similarity: number
}

interface KnowledgeAnswer {
  answer: string
  sources: Array<{
    id: string
    title: string
    platform: string
    url: string
    similarity: number
  }>
}

interface UserInsights {
  summary: string
  topThemes: string[]
  recommendations: string[]
}

interface KnowledgeState {
  searchResults: SearchResult[]
  answer: KnowledgeAnswer | null
  insights: UserInsights | null
  isSearching: boolean
  isAsking: boolean
  isLoadingInsights: boolean
  isIndexing: boolean
  searchQuery: string

  semanticSearch: (query: string) => Promise<void>
  askQuestion: (question: string) => Promise<void>
  fetchInsights: () => Promise<void>
  indexContent: () => Promise<{ indexed: number }>
  setSearchQuery: (query: string) => void
  clearResults: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  searchResults: [],
  answer: null,
  insights: null,
  isSearching: false,
  isAsking: false,
  isLoadingInsights: false,
  isIndexing: false,
  searchQuery: '',

  semanticSearch: async (query: string) => {
    set({ isSearching: true, searchQuery: query })
    try {
      const data = await api.post<{ results: SearchResult[] }>('/knowledge/search', { query, limit: 10 })
      set({ searchResults: data.results, isSearching: false })
    } catch {
      set({ isSearching: false })
    }
  },

  askQuestion: async (question: string) => {
    set({ isAsking: true })
    try {
      const data = await api.post<KnowledgeAnswer>('/knowledge/ask', { question })
      set({ answer: data, isAsking: false })
    } catch {
      set({ isAsking: false })
    }
  },

  fetchInsights: async () => {
    set({ isLoadingInsights: true })
    try {
      const data = await api.get<UserInsights>('/knowledge/insights')
      set({ insights: data, isLoadingInsights: false })
    } catch {
      set({ isLoadingInsights: false })
    }
  },

  indexContent: async () => {
    set({ isIndexing: true })
    try {
      const data = await api.post<{ indexed: number }>('/knowledge/index', {})
      set({ isIndexing: false })
      return data
    } catch {
      set({ isIndexing: false })
      return { indexed: 0 }
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearResults: () => set({ searchResults: [], answer: null }),
}))
