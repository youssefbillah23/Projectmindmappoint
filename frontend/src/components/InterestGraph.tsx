import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pin, VolumeX, Volume2, TrendingUp } from 'lucide-react'
import { Card } from './ui/Card'
import { Loader } from './ui/Loader'
import { cn } from '../lib/utils'
import { api } from '../lib/api'
import type { InterestTopic } from '../types'

export function InterestGraph() {
  const [topics, setTopics] = useState<InterestTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const data = await api.get<InterestTopic[]>('/interests')
      setTopics(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const togglePin = async (id: string, isPinned: boolean) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned } : t))
    )
    try {
      await api.patch(`/interests/${id}`, { isPinned })
    } catch {
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPinned: !isPinned } : t))
      )
    }
  }

  const toggleMute = async (id: string, isMuted: boolean) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isMuted } : t))
    )
    try {
      await api.patch(`/interests/${id}`, { isMuted })
    } catch {
      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isMuted: !isMuted } : t))
      )
    }
  }

  if (loading) return <Loader className="py-8" />

  if (topics.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-10 w-10 text-muted/50 mx-auto mb-3" />
        <p className="text-sm text-muted">
          No interests detected yet. Save more content to build your interest
          profile.
        </p>
      </div>
    )
  }

  const maxScore = Math.max(...topics.map((t) => t.score))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Based on your saves and activity
      </p>

      {topics.slice(0, 10).map((topic, i) => {
        const percent = maxScore > 0 ? (topic.score / maxScore) * 100 : 0

        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={cn(
                'flex items-center gap-3 py-3',
                topic.isMuted && 'opacity-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-txt truncate">
                    {topic.topic}
                  </span>
                  {topic.isPinned && (
                    <Pin className="h-3 w-3 text-primary shrink-0" />
                  )}
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <span className="text-[10px] text-muted mt-1 block">
                  Score: {topic.score.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => togglePin(topic.id, !topic.isPinned)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    topic.isPinned
                      ? 'text-primary bg-primary/10'
                      : 'text-muted hover:text-txt hover:bg-surface-hover'
                  )}
                  title={topic.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleMute(topic.id, !topic.isMuted)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    topic.isMuted
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted hover:text-txt hover:bg-surface-hover'
                  )}
                  title={topic.isMuted ? 'Unmute' : 'Mute'}
                >
                  {topic.isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
