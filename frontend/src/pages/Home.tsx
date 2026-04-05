import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Sparkles, Archive } from 'lucide-react'
import { useBriefingStore } from '../store/briefingStore'
import { BriefingCard } from '../components/BriefingCard'
import { AudioPlayer } from '../components/AudioPlayer'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'

export default function Home() {
  const {
    stories,
    currentIndex,
    isLoading,
    error,
    fetchTodayBriefing,
    generateBriefing,
    currentBriefing,
  } = useBriefingStore()

  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [direction, setDirection] = useState(0)
  const [prevIndex, setPrevIndex] = useState(0)

  useEffect(() => {
    fetchTodayBriefing()
  }, [fetchTodayBriefing])

  useEffect(() => {
    setDirection(currentIndex > prevIndex ? 1 : -1)
    setPrevIndex(currentIndex)
  }, [currentIndex, prevIndex])

  const handleToggleAudio = useCallback(
    (url: string | undefined) => {
      if (!url) return
      setAudioUrl((prev) => (prev === url ? null : url))
    },
    []
  )

  const handleCloseAudio = useCallback(() => {
    setAudioUrl(null)
  }, [])

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const currentStory = stories[currentIndex]

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] lg:h-dvh">
      {/* Header */}
      <header className="shrink-0 px-4 pt-4 pb-2 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-txt">Your Morning Briefing</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-muted" />
              <span className="text-sm text-muted">{today}</span>
            </div>
          </div>
          <Link
            to="/feed"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-txt transition-colors"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </Link>
        </div>
      </header>

      {/* Briefing content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={fetchTodayBriefing} variant="outline">
              Try Again
            </Button>
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
            <h2 className="text-lg font-semibold text-txt mb-2">
              No briefing yet
            </h2>
            <p className="text-sm text-muted mb-6 max-w-xs">
              Generate your first briefing to get a curated summary of your
              saved content.
            </p>
            <Button onClick={generateBriefing} size="lg">
              <Sparkles className="h-4 w-4" />
              Generate Briefing
            </Button>
          </div>
        ) : currentStory ? (
          <BriefingCard
            story={currentStory}
            index={currentIndex}
            total={stories.length}
            direction={direction}
            onToggleAudio={handleToggleAudio}
            isAudioPlaying={audioUrl === currentStory.audioUrl}
          />
        ) : null}
      </div>

      {/* Audio player */}
      {audioUrl && currentStory && (
        <AudioPlayer
          audioUrl={audioUrl}
          title={currentStory.title}
          onClose={handleCloseAudio}
        />
      )}
    </div>
  )
}
