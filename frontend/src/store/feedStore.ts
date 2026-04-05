import { create } from 'zustand'
import { api } from '../lib/api'
import type { SavedItem, FeedFilters, PaginationParams } from '../types'

interface FeedState {
  items: SavedItem[]
  filters: FeedFilters
  pagination: PaginationParams
  isLoading: boolean
  error: string | null
  fetchFeed: (params?: Partial<FeedFilters & { page?: number }>) => Promise<void>
  loadMore: () => Promise<void>
  setFilter: (filters: Partial<FeedFilters>) => void
  search: (query: string) => void
  resetFilters: () => void
}

const defaultPagination: PaginationParams = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  filters: { sort: 'latest' },
  pagination: { ...defaultPagination },
  isLoading: false,
  error: null,

  fetchFeed: async (params) => {
    const { filters } = get()
    const mergedFilters = { ...filters, ...params }
    const page = params?.page || 1

    set({ isLoading: true, error: null })

    try {
      const queryParams = new URLSearchParams()
      if (mergedFilters.platform) queryParams.set('platform', mergedFilters.platform)
      if (mergedFilters.topic) queryParams.set('topic', mergedFilters.topic)
      if (mergedFilters.search) queryParams.set('search', mergedFilters.search)
      if (mergedFilters.sort) queryParams.set('sort', mergedFilters.sort)
      queryParams.set('page', String(page))
      queryParams.set('limit', '20')

      const result = await api.get<{
        items: SavedItem[]
        total: number
        page: number
        hasMore: boolean
      }>(`/feed?${queryParams.toString()}`)

      set({
        items: page === 1 ? result.items : [...get().items, ...result.items],
        pagination: {
          page: result.page,
          limit: 20,
          total: result.total,
          hasMore: result.hasMore,
        },
        filters: mergedFilters,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load feed', isLoading: false })
    }
  },

  loadMore: async () => {
    const { pagination, filters } = get()
    if (!pagination.hasMore) return
    await get().fetchFeed({ ...filters, page: pagination.page + 1 })
  },

  setFilter: (newFilters) => {
    const { filters, fetchFeed } = get()
    const merged = { ...filters, ...newFilters }
    set({ filters: merged })
    fetchFeed({ ...merged, page: 1 })
  },

  search: (query: string) => {
    get().setFilter({ search: query || undefined })
  },

  resetFilters: () => {
    set({ filters: { sort: 'latest' } })
    get().fetchFeed({ sort: 'latest', page: 1 })
  },
}))
