import { create } from 'zustand'
import { api } from '../lib/api'
import type { GeneratedPost, PostTone } from '../types'

interface PostState {
  generatedPosts: GeneratedPost[]
  isGenerating: boolean
  error: string | null
  generatePosts: (sourceItemId: string, tone: PostTone) => Promise<void>
  updateDraft: (id: string, content: string) => void
  deleteDraft: (id: string) => Promise<void>
  scheduleDraft: (id: string, scheduledAt: string) => Promise<void>
  fetchRecentPosts: () => Promise<void>
}

export const usePostStore = create<PostState>((set, get) => ({
  generatedPosts: [],
  isGenerating: false,
  error: null,

  generatePosts: async (sourceItemId: string, tone: PostTone) => {
    set({ isGenerating: true, error: null })
    try {
      const posts = await api.post<GeneratedPost[]>('/posts/generate', {
        sourceItemId,
        tone,
      })
      set({
        generatedPosts: [...posts, ...get().generatedPosts],
        isGenerating: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to generate posts', isGenerating: false })
    }
  },

  updateDraft: (id: string, content: string) => {
    set({
      generatedPosts: get().generatedPosts.map((p) =>
        p.id === id ? { ...p, content } : p
      ),
    })
  },

  deleteDraft: async (id: string) => {
    const prev = get().generatedPosts
    set({ generatedPosts: prev.filter((p) => p.id !== id) })
    try {
      await api.delete(`/posts/${id}`)
    } catch {
      set({ generatedPosts: prev })
    }
  },

  scheduleDraft: async (id: string, scheduledAt: string) => {
    try {
      const updated = await api.patch<GeneratedPost>(`/posts/${id}`, {
        scheduledAt,
        status: 'scheduled',
      })
      set({
        generatedPosts: get().generatedPosts.map((p) =>
          p.id === id ? updated : p
        ),
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to schedule post' })
    }
  },

  fetchRecentPosts: async () => {
    try {
      const posts = await api.get<GeneratedPost[]>('/posts')
      set({ generatedPosts: posts })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load posts' })
    }
  },
}))
