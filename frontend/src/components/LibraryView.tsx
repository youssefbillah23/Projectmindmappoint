import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  Check,
  Trash2,
  PenSquare,
  BookOpen,
  Tag,
} from 'lucide-react'
import { useLibraryStore } from '../store/libraryStore'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { cn } from '../lib/utils'

const filterTabs = [
  { value: 'all' as const, label: 'All' },
  { value: 'unread' as const, label: 'Unread' },
  { value: 'done' as const, label: 'Done' },
]

function SwipeableItem({
  children,
  onDelete,
}: {
  children: React.ReactNode
  onDelete: () => void
}) {
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-150, -50], [1, 0])

  return (
    <div className="relative overflow-hidden rounded-xl">
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-6 bg-destructive"
        style={{ opacity: bgOpacity }}
      >
        <Trash2 className="h-5 w-5 text-white" />
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -120) {
            onDelete()
          }
        }}
        style={{ x }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function LibraryView() {
  const navigate = useNavigate()
  const {
    items,
    isLoading,
    filter,
    tagFilter,
    fetchLibrary,
    removeFromLibrary,
    markDone,
    setFilter,
    setTagFilter,
  } = useLibraryStore()

  useEffect(() => {
    fetchLibrary()
  }, [fetchLibrary])

  const allTags = Array.from(
    new Set(items.flatMap((i) => i.tags))
  ).sort()

  const filteredItems = items.filter((item) => {
    if (filter === 'unread' && item.isDone) return false
    if (filter === 'done' && !item.isDone) return false
    if (tagFilter && !item.tags.includes(tagFilter)) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-txt border border-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              'shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              !tagFilter
                ? 'bg-primary/20 text-primary'
                : 'bg-surface text-muted border border-border'
            )}
          >
            <Tag className="h-3 w-3" />
            All Tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tagFilter === tag
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface text-muted border border-border'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Items */}
      {isLoading ? (
        <Loader className="py-12" />
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted/50 mb-4" />
          <p className="text-lg font-medium text-txt mb-1">
            {filter === 'all'
              ? 'Library is empty'
              : filter === 'unread'
                ? 'No unread items'
                : 'No completed items'}
          </p>
          <p className="text-sm text-muted">
            Save items from your briefing or feed to build your reading list.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -200 }}
              >
                <SwipeableItem onDelete={() => removeFromLibrary(item.id)}>
                  <Card
                    className={cn(
                      'flex items-start gap-3',
                      item.isDone && 'opacity-60'
                    )}
                  >
                    {/* Done checkbox */}
                    <button
                      onClick={() => markDone(item.id, !item.isDone)}
                      className={cn(
                        'mt-0.5 shrink-0 h-5 w-5 rounded border transition-colors flex items-center justify-center',
                        item.isDone
                          ? 'bg-primary border-primary'
                          : 'border-border hover:border-primary'
                      )}
                    >
                      {item.isDone && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-medium text-txt line-clamp-1',
                          item.isDone && 'line-through'
                        )}
                      >
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {item.sourceName}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate('/studio', {
                          state: {
                            sourceItemId: item.savedItemId,
                            sourceTitle: item.title,
                            sourceSummary: item.summary,
                          },
                        })
                      }
                      className="shrink-0 text-xs h-7"
                    >
                      <PenSquare className="h-3 w-3" />
                    </Button>
                  </Card>
                </SwipeableItem>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
