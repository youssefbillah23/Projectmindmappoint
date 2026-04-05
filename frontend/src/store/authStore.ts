import { create } from 'zustand'
import { api } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = await api.post<User>('/auth/login', { email, password })
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false })
      throw err
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null })
    try {
      const user = await api.post<User>('/auth/register', { email, password, name })
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // proceed even if api call fails
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const user = await api.get<User>('/auth/me')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  refreshToken: async () => {
    try {
      await api.post('/auth/refresh')
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  },

  clearError: () => set({ error: null }),
}))
