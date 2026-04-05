import { create } from 'zustand'
import { api } from '../lib/api'
import type { Briefing, BriefingStory } from '../types'

interface BriefingState {
  currentBriefing: Briefing | null
  stories: BriefingStory[]
  currentIndex: number
  isLoading: boolean
  error: string | null
  fetchTodayBriefing: () => Promise<void>
  nextStory: () => void
  prevStory: () => void
  goToStory: (index: number) => void
  generateBriefing: () => Promise<void>
  recordInteraction: (storyId: string, type: string) => Promise<void>
}

export const useBriefingStore = create<BriefingState>((set, get) => ({
  currentBriefing: null,
  stories: [],
  currentIndex: 0,
  isLoading: false,
  error: null,

  fetchTodayBriefing: async () => {
    set({ isLoading: true, error: null })
    try {
      const briefing = await api.get<Briefing>('/briefings/today')
      set({
        currentBriefing: briefing,
        stories: briefing.stories || [],
        currentIndex: 0,
        isLoading: false,
      })
    } catch (err: any) {
      set({
        currentBriefing: null,
        stories: [],
        isLoading: false,
        error: err.message || 'Failed to load briefing',
      })
    }
  },

  nextStory: () => {
    const { currentIndex, stories } = get()
    if (currentIndex < stories.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prevStory: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  goToStory: (index: number) => {
    const { stories } = get()
    if (index >= 0 && index < stories.length) {
      set({ currentIndex: index })
    }
  },

  generateBriefing: async () => {
    set({ isLoading: true, error: null })
    try {
      const briefing = await api.post<Briefing>('/briefings/generate')
      set({
        currentBriefing: briefing,
        stories: briefing.stories || [],
        currentIndex: 0,
        isLoading: false,
      })
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Failed to generate briefing' })
    }
  },

  recordInteraction: async (storyId: string, type: string) => {
    try {
      await api.post('/interactions', { storyId, type })
    } catch {
      // non-blocking
    }
  },
}))
