import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  PenSquare,
  Inbox,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFeedStore } from '../store/feedStore'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { Input } from './ui/Input'
import { cn } from '../lib/utils'
import type { Platform } from '../types'

const platformTabs: { value: Platform | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TWITTER', label: 'X / Twitter' },
  { value: 'INSTAGRAM', label: 'Instagram' },
]

const platformBadgeVariant: Record<Platform, 'linkedin' | 'twitter' | 'instagram'> = {
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
}

export function UnifiedFeed() {
  const navigate = useNavigate()
  const {
    items,
    filters,
    pagination,
    isLoading,
    fetchFeed,
    loadMore,
    setFilter,
    search,
  } = useFeedStore()
  const observerRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetchFeed({ page: 1 })
  }, [fetchFeed])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pagination.hasMore, isLoading, loadMore])

  const handleSearch = useCallback(
    (value: string) => {
      clearTimeout(searchTimeout.current)
      searchTimeout.current = setTimeout(() => {
        search(value)
      }, 300)
    },
    [search]
  )

  const activePlatform = filters.platform || 'ALL'

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Search saves..."
          defaultValue={filters.search || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-txt placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {platformTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() =>
              setFilter({
                platform: tab.value === 'ALL' ? undefined : tab.value,
              })
            }
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activePlatform === tab.value
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-txt border border-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {pagination.total} item{pagination.total !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted" />
          <select
            value={filters.sort || 'latest'}
            onChange={(e) =>
              setFilter({ sort: e.target.value as 'latest' | 'relevance' })
            }
            className="bg-transparent text-sm text-muted focus:outline-none cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>
      </div>

      {/* Feed items */}
      {isLoading && items.length === 0 ? (
        <Loader className="py-12" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-12 w-12 text-muted/50 mb-4" />
          <p className="text-lg font-medium text-txt mb-1">No saves yet</p>
          <p className="text-sm text-muted">
            Connect your platforms to start seeing your saved content here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card className="space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={platformBadgeVariant[item.platform]}>
                        {item.platform}
                      </Badge>
                      {item.topics.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-txt line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 mt-1">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted">
                    Saved {new Date(item.savedAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate('/studio', {
                        state: {
                          sourceItemId: item.id,
                          sourceTitle: item.title,
                          sourceSummary: item.summary,
                        },
                      })
                    }
                    className="text-xs h-7"
                  >
                    <PenSquare className="h-3 w-3" />
                    Create Post
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Load more sentinel */}
      <div ref={observerRef} className="h-8">
        {isLoading && items.length > 0 && <Loader size="sm" className="py-2" />}
      </div>
    </div>
  )
}
