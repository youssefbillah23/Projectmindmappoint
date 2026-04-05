import { useState, useCallback } from 'react'
import {
  Briefcase,
  AtSign,
  Camera,
  Copy,
  RefreshCw,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Loader } from './ui/Loader'
import { cn } from '../lib/utils'
import { usePostStore } from '../store/postStore'
import type { Platform, PostTone, GeneratedPost } from '../types'

interface PostGeneratorProps {
  sourceItemId: string
  sourceTitle: string
  sourceSummary: string
}

const tones: { value: PostTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'bold', label: 'Bold' },
  { value: 'educational', label: 'Educational' },
]

const platformConfig: Record<
  Platform,
  {
    icon: typeof Briefcase | typeof AtSign
    label: string
    color: string
    borderColor: string
    maxChars: number
  }
> = {
  LINKEDIN: {
    icon: Briefcase,
    label: 'LinkedIn',
    color: 'text-linkedin',
    borderColor: 'border-linkedin/30',
    maxChars: 3000,
  },
  TWITTER: {
    icon: AtSign,
    label: 'X / Twitter',
    color: 'text-twitter',
    borderColor: 'border-twitter/30',
    maxChars: 280,
  },
  INSTAGRAM: {
    icon: Camera,
    label: 'Instagram',
    color: 'text-instagram',
    borderColor: 'border-instagram/30',
    maxChars: 2200,
  },
}

function DraftCard({
  post,
  onUpdate,
  onRegenerate,
  onSchedule,
}: {
  post: GeneratedPost
  onUpdate: (id: string, content: string) => void
  onRegenerate: (sourceItemId: string, tone: PostTone) => void
  onSchedule: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const config = platformConfig[post.platform]
  const Icon = config.icon

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(post.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [post.content])

  return (
    <Card className={cn('border-l-2', config.borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('h-4 w-4', config.color)} />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
        <span className="ml-auto text-xs text-muted">
          {post.content.length}/{config.maxChars}
        </span>
      </div>

      <textarea
        value={post.content}
        onChange={(e) => onUpdate(post.id, e.target.value)}
        rows={6}
        className="w-full rounded-lg bg-bg border border-border p-3 text-sm text-txt resize-none focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-xs"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRegenerate(post.sourceItemId, post.tone)}
          className="text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Redo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSchedule(post.id)}
          className="text-xs ml-auto"
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule
        </Button>
      </div>
    </Card>
  )
}

export function PostGenerator({
  sourceItemId,
  sourceTitle,
  sourceSummary,
}: PostGeneratorProps) {
  const [selectedTone, setSelectedTone] = useState<PostTone>('professional')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const { generatedPosts, isGenerating, generatePosts, updateDraft, scheduleDraft } =
    usePostStore()

  const relevantPosts = generatedPosts.filter(
    (p) => p.sourceItemId === sourceItemId
  )

  const linkedinPost = relevantPosts.find((p) => p.platform === 'LINKEDIN')
  const twitterPost = relevantPosts.find((p) => p.platform === 'TWITTER')
  const instagramPost = relevantPosts.find((p) => p.platform === 'INSTAGRAM')
  const platformPosts = [linkedinPost, twitterPost, instagramPost].filter(
    Boolean
  ) as GeneratedPost[]

  const handleGenerate = () => {
    generatePosts(sourceItemId, selectedTone)
  }

  const handleSchedule = (id: string) => {
    setScheduleId(id)
  }

  const confirmSchedule = () => {
    if (scheduleId && scheduleDate) {
      scheduleDraft(scheduleId, new Date(scheduleDate).toISOString())
      setScheduleId(null)
      setScheduleDate('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Source preview */}
      <Card className="bg-bg">
        <p className="text-xs text-muted uppercase tracking-wider mb-1">
          Source Content
        </p>
        <h3 className="text-base font-semibold text-txt mb-2">
          {sourceTitle}
        </h3>
        <p className="text-sm text-muted line-clamp-3">{sourceSummary}</p>
      </Card>

      {/* Tone selector */}
      <div>
        <p className="text-sm font-medium text-txt mb-3">Select Tone</p>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <button
              key={tone.value}
              onClick={() => setSelectedTone(tone.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                selectedTone === tone.value
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted hover:text-txt border border-border'
              )}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <Loader size="sm" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : 'Generate Posts'}
      </Button>

      {/* Generated drafts */}
      <AnimatePresence>
        {platformPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 lg:grid-cols-3"
          >
            {platformPosts.map((post) => (
              <DraftCard
                key={post.id}
                post={post}
                onUpdate={updateDraft}
                onRegenerate={generatePosts}
                onSchedule={handleSchedule}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule modal */}
      <AnimatePresence>
        {scheduleId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setScheduleId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <Card className="space-y-4">
                <h3 className="text-lg font-semibold text-txt">
                  Schedule Post
                </h3>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm text-txt focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setScheduleId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={confirmSchedule}
                    disabled={!scheduleDate}
                  >
                    Confirm
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
