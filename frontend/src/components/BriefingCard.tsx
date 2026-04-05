import { useState, useRef, useCallback } from 'react'
import {
  motion,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion'
import { Volume2, VolumeX, ChevronUp, Bookmark } from 'lucide-react'
import type { BriefingStory, Platform } from '../types'
import { Badge } from './ui/Badge'
import { cn } from '../lib/utils'
import { useBriefingStore } from '../store/briefingStore'
import { useLibraryStore } from '../store/libraryStore'

interface BriefingCardProps {
  story: BriefingStory
  index: number
  total: number
  direction: number
  onToggleAudio?: (audioUrl: string | undefined) => void
  isAudioPlaying?: boolean
}

const platformBadgeVariant: Record<Platform, 'linkedin' | 'twitter' | 'instagram'> = {
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
}

const platformLabel: Record<Platform, string> = {
  LINKEDIN: 'LinkedIn',
  TWITTER: 'X / Twitter',
  INSTAGRAM: 'Instagram',
}

function estimateReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200))
  return `${minutes} min read`
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function BriefingCard({
  story,
  index,
  total,
  direction,
  onToggleAudio,
  isAudioPlaying,
}: BriefingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { nextStory, prevStory, recordInteraction } = useBriefingStore()
  const { addToLibrary } = useLibraryStore()

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset } = info
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x > 100) {
          prevStory()
        } else if (offset.x < -100) {
          nextStory()
          recordInteraction(story.id, 'READ')
        }
      } else {
        if (offset.y < -100) {
          setExpanded(true)
          recordInteraction(story.id, 'EXPAND')
        } else if (offset.y > 100) {
          nextStory()
          recordInteraction(story.id, 'SKIP')
        }
      }
    },
    [nextStory, prevStory, recordInteraction, story.id]
  )

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (expanded) {
        setExpanded(false)
        return
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const third = rect.width / 3
      if (x < third) {
        prevStory()
      } else if (x > third * 2) {
        nextStory()
        recordInteraction(story.id, 'READ')
      }
    },
    [expanded, nextStory, prevStory, recordInteraction, story.id]
  )

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      addToLibrary(story.savedItemId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 500)
  }, [addToLibrary, story.savedItemId])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        key={story.id}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 flex flex-col justify-end select-none touch-pan-y"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/20"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  i < index
                    ? 'w-full bg-white'
                    : i === index
                      ? 'w-full bg-primary'
                      : 'w-0'
                )}
              />
            </div>
          ))}
        </div>

        {/* Saved indicator */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2">
                <Bookmark className="h-5 w-5 text-white fill-white" />
                <span className="text-sm font-medium text-white">Saved to Library</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="gradient-overlay absolute inset-0 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 p-6 pb-8 space-y-4">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={platformBadgeVariant[story.platform]}>
              {platformLabel[story.platform]}
            </Badge>
            {story.topics.slice(0, 2).map((topic) => (
              <Badge key={topic} variant="default">
                {topic}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white leading-tight">
            {story.title}
          </h2>

          {/* Summary */}
          <motion.div
            animate={{ height: expanded ? 'auto' : '3rem' }}
            className="overflow-hidden"
          >
            <p className="text-base text-white/80 leading-relaxed">
              {expanded && story.summaryLong ? story.summaryLong : story.summary}
            </p>
          </motion.div>

          {/* Expand hint */}
          {!expanded && story.summaryLong && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
                recordInteraction(story.id, 'EXPAND')
              }}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
              Swipe up or tap to read more
            </button>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span>{story.sourceName}</span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{estimateReadTime(story.wordCount)}</span>
            </div>

            {/* Audio toggle */}
            {story.audioUrl && onToggleAudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleAudio(story.audioUrl)
                  recordInteraction(story.id, 'LISTEN')
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  isAudioPlaying
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
              >
                {isAudioPlaying ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {isAudioPlaying ? 'Stop' : 'Listen'}
              </button>
            )}
          </div>

          {/* Story counter */}
          <div className="text-center text-xs text-white/40">
            {index + 1} of {total}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
