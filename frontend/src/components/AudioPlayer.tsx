import { useState, useEffect, useRef, useCallback } from 'react'
import { Howl } from 'howler'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Gauge,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  title: string
  onClose: () => void
}

const SPEEDS = [1, 1.5, 2] as const

export function AudioPlayer({ audioUrl, title, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [seek, setSeek] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(0)
  const howlRef = useRef<Howl | null>(null)
  const rafRef = useRef<number>(0)

  const updateSeek = useCallback(() => {
    if (howlRef.current && howlRef.current.playing()) {
      setSeek(howlRef.current.seek() as number)
      rafRef.current = requestAnimationFrame(updateSeek)
    }
  }, [])

  useEffect(() => {
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      onload: () => {
        setDuration(howl.duration())
      },
      onplay: () => {
        setIsPlaying(true)
        rafRef.current = requestAnimationFrame(updateSeek)
      },
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false)
        setSeek(0)
      },
      onend: () => {
        setIsPlaying(false)
        setSeek(0)
      },
    })
    howlRef.current = howl
    howl.play()

    return () => {
      cancelAnimationFrame(rafRef.current)
      howl.unload()
    }
  }, [audioUrl, updateSeek])

  const togglePlay = () => {
    if (!howlRef.current) return
    if (isPlaying) {
      howlRef.current.pause()
    } else {
      howlRef.current.play()
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!howlRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newSeek = ratio * duration
    howlRef.current.seek(newSeek)
    setSeek(newSeek)
  }

  const skip = (seconds: number) => {
    if (!howlRef.current) return
    const current = howlRef.current.seek() as number
    const newSeek = Math.max(0, Math.min(duration, current + seconds))
    howlRef.current.seek(newSeek)
    setSeek(newSeek)
  }

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length
    setSpeedIndex(next)
    if (howlRef.current) {
      howlRef.current.rate(SPEEDS[next])
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (seek / duration) * 100 : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 max-w-lg mx-auto"
      >
        <div className="glass rounded-2xl border border-border p-4 shadow-2xl">
          {/* Title + close */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-txt truncate pr-4">
              {title}
            </p>
            <button
              onClick={onClose}
              className="text-muted hover:text-txt transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div
            className="h-1.5 rounded-full bg-white/10 cursor-pointer mb-2"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time */}
          <div className="flex justify-between text-[10px] text-muted mb-3">
            <span>{formatTime(seek)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            {/* Speed */}
            <button
              onClick={cycleSpeed}
              className="flex items-center gap-1 text-xs text-muted hover:text-txt transition-colors"
            >
              <Gauge className="h-3.5 w-3.5" />
              {SPEEDS[speedIndex]}x
            </button>

            {/* Skip back */}
            <button
              onClick={() => skip(-15)}
              className="text-muted hover:text-txt transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-full transition-colors',
                'bg-primary hover:bg-primary-hover text-white'
              )}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            {/* Skip forward */}
            <button
              onClick={() => skip(15)}
              className="text-muted hover:text-txt transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            {/* Spacer to balance speed button */}
            <div className="w-10" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
