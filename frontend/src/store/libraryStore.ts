import { create } from 'zustand'
import { api } from '../lib/api'
import type { LibraryItem } from '../types'

interface LibraryState {
  items: LibraryItem[]
  isLoading: boolean
  error: string | null
  filter: 'all' | 'unread' | 'done'
  tagFilter: string | null
  fetchLibrary: () => Promise<void>
  addToLibrary: (savedItemId: string) => Promise<void>
  removeFromLibrary: (id: string) => Promise<void>
  markDone: (id: string, isDone: boolean) => Promise<void>
  updateTags: (id: string, tags: string[]) => Promise<void>
  setFilter: (filter: 'all' | 'unread' | 'done') => void
  setTagFilter: (tag: string | null) => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  filter: 'all',
  tagFilter: null,

  fetchLibrary: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await api.get<LibraryItem[]>('/library')
      set({ items, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load library', isLoading: false })
    }
  },

  addToLibrary: async (savedItemId: string) => {
    try {
      const item = await api.post<LibraryItem>('/library', { savedItemId })
      set({ items: [item, ...get().items] })
    } catch (err: any) {
      set({ error: err.message || 'Failed to add to library' })
    }
  },

  removeFromLibrary: async (id: string) => {
    const prev = get().items
    set({ items: prev.filter((i) => i.id !== id) })
    try {
      await api.delete(`/library/${id}`)
    } catch {
      set({ items: prev })
    }
  },

  markDone: async (id: string, isDone: boolean) => {
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, isDone } : i)),
    })
    try {
      await api.patch(`/library/${id}`, { isDone })
    } catch {
      set({
        items: get().items.map((i) => (i.id === id ? { ...i, isDone: !isDone } : i)),
      })
    }
  },

  updateTags: async (id: string, tags: string[]) => {
    const prev = get().items
    set({
      items: prev.map((i) => (i.id === id ? { ...i, tags } : i)),
    })
    try {
      await api.patch(`/library/${id}`, { tags })
    } catch {
      set({ items: prev })
    }
  },

  setFilter: (filter) => set({ filter }),
  setTagFilter: (tag) => set({ tagFilter: tag }),
}))
