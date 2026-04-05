export type Platform = 'LINKEDIN' | 'TWITTER' | 'INSTAGRAM'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  briefingTime?: string
  timezone?: string
  notificationsEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface PlatformConnection {
  id: string
  userId: string
  platform: Platform
  platformUsername?: string
  connected: boolean
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

export interface SavedItem {
  id: string
  userId: string
  platform: Platform
  platformItemId: string
  title: string
  summary: string
  summaryLong?: string
  url: string
  authorName?: string
  authorAvatar?: string
  topics: string[]
  savedAt: string
  createdAt: string
}

export interface BriefingStory {
  id: string
  briefingId: string
  savedItemId: string
  title: string
  summary: string
  summaryLong?: string
  sourceName: string
  sourceUrl?: string
  platform: Platform
  topics: string[]
  audioUrl?: string
  wordCount: number
  order: number
}

export interface Briefing {
  id: string
  userId: string
  date: string
  stories: BriefingStory[]
  generatedAt: string
  createdAt: string
}

export interface LibraryItem {
  id: string
  userId: string
  savedItemId: string
  title: string
  summary: string
  sourceName: string
  sourceUrl?: string
  platform: Platform
  topics: string[]
  tags: string[]
  isDone: boolean
  savedAt: string
  createdAt: string
}

export interface GeneratedPost {
  id: string
  userId: string
  sourceItemId: string
  platform: Platform
  content: string
  tone: PostTone
  scheduledAt?: string
  publishedAt?: string
  status: 'draft' | 'scheduled' | 'published'
  createdAt: string
  updatedAt: string
}

export type PostTone = 'professional' | 'casual' | 'bold' | 'educational'

export interface InterestTopic {
  id: string
  userId: string
  topic: string
  score: number
  isPinned: boolean
  isMuted: boolean
}

export interface UserInteraction {
  id: string
  userId: string
  storyId: string
  type: 'READ' | 'SKIP' | 'SAVE' | 'LISTEN' | 'EXPAND'
  createdAt: string
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface FeedFilters {
  platform?: Platform
  topic?: string
  search?: string
  sort?: 'latest' | 'relevance'
}
