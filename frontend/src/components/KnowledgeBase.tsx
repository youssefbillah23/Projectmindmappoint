import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MessageCircle,
  Sparkles,
  Brain,
  BookOpen,
  Zap,
  ExternalLink,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Send,
  RefreshCw,
} from 'lucide-react'
import { useKnowledgeStore } from '../store/knowledgeStore'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { cn } from '../lib/utils'

const examplePrompts = [
  'What are my top interests?',
  'What do I know about AI?',
  'What trends am I following?',
  'Summarize my bookmarks about marketing',
]

function PlatformBadge({ platform }: { platform: string }) {
  const variant =
    platform === 'linkedin'
      ? 'linkedin'
      : platform === 'twitter'
        ? 'twitter'
        : platform === 'instagram'
          ? 'instagram'
          : 'outline'

  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {platform}
    </Badge>
  )
}

function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-muted font-medium tabular-nums">
        {pct}%
      </span>
    </div>
  )
}

function AskAISection() {
  const [question, setQuestion] = useState('')
  const { answer, isAsking, askQuestion, clearResults } = useKnowledgeStore()

  const handleAsk = () => {
    if (!question.trim()) return
    askQuestion(question.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-txt">Ask AI</h2>
      </div>

      {/* Input area */}
      <div className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your saved content..."
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface p-4 pr-14 text-sm text-txt placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        <Button
          size="icon"
          onClick={handleAsk}
          disabled={!question.trim() || isAsking}
          className="absolute right-3 bottom-3 h-8 w-8 rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Example prompts */}
      <div className="flex flex-wrap gap-2">
        {examplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setQuestion(prompt)
              askQuestion(prompt)
            }}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-txt hover:border-primary/40 transition-colors"
          >
            <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {isAsking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="text-sm text-muted">
                Thinking through your content...
              </span>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer */}
      <AnimatePresence>
        {answer && !isAsking && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <Card className="border-primary/20">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">
                    {answer.answer}
                  </p>
                </div>
              </div>
            </Card>

            {/* Source cards */}
            {answer.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Sources
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {answer.sources.map((source) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="flex items-start gap-3 !p-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-medium text-txt line-clamp-1">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <PlatformBadge platform={source.platform} />
                            <SimilarityBar value={source.similarity} />
                          </div>
                        </div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted hover:text-primary transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={clearResults}
              className="text-xs text-muted hover:text-txt transition-colors"
            >
              Clear answer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function SemanticSearchSection() {
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { searchResults, isSearching, semanticSearch } = useKnowledgeStore()

  const handleSearch = () => {
    if (!query.trim()) return
    semanticSearch(query.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-txt">Semantic Search</h2>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search your knowledge base..."
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-20 py-2.5 text-sm text-txt placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
        >
          Search
        </Button>
      </div>

      {/* Loading */}
      {isSearching && <Loader className="py-8" />}

      {/* Results */}
      <AnimatePresence>
        {!isSearching && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted">
              {searchResults.length} result{searchResults.length !== 1 && 's'}{' '}
              found
            </p>
            {searchResults.map((result, i) => {
              const isExpanded = expandedId === result.item.id
              return (
                <motion.div
                  key={result.item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary/30',
                      isExpanded && 'border-primary/30'
                    )}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : result.item.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-txt line-clamp-1">
                            {result.item.title}
                          </h3>
                          <button
                            className="shrink-0 text-muted"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedId(
                                isExpanded ? null : result.item.id
                              )
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <PlatformBadge platform={result.item.platform} />
                          <div className="w-24">
                            <SimilarityBar value={result.similarity} />
                          </div>
                          <span className="text-[10px] text-muted">
                            {new Date(
                              result.item.savedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-muted line-clamp-2">
                          {result.item.summaryShort}
                        </p>

                        {result.item.topicTags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {result.item.topicTags.map((tag) => (
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

                        {/* Expanded body */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 border-t border-border mt-2 space-y-2">
                                <p className="text-xs text-txt/80 leading-relaxed whitespace-pre-wrap">
                                  {result.item.body}
                                </p>
                                {result.item.url && (
                                  <a
                                    href={result.item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open original
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function InsightsSection() {
  const [indexResult, setIndexResult] = useState<number | null>(null)
  const {
    insights,
    isLoadingInsights,
    isIndexing,
    fetchInsights,
    indexContent,
  } = useKnowledgeStore()

  const handleIndex = async () => {
    const result = await indexContent()
    setIndexResult(result.indexed)
    setTimeout(() => setIndexResult(null), 5000)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-txt">Your Insights</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          disabled={isLoadingInsights}
          className="text-xs"
        >
          {isLoadingInsights ? (
            <>
              <Loader size="sm" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Generate Insights
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleIndex}
          disabled={isIndexing}
          className="text-xs"
        >
          {isIndexing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <BookOpen className="h-3.5 w-3.5" />
              Index New Content
            </>
          )}
        </Button>
      </div>

      {/* Index result toast */}
      <AnimatePresence>
        {indexResult !== null && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="!p-3 border-primary/20">
              <p className="text-xs text-primary">
                Successfully indexed {indexResult} item
                {indexResult !== 1 && 's'} into your knowledge base.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoadingInsights && <Loader className="py-8" />}

      {/* Insights content */}
      <AnimatePresence>
        {insights && !isLoadingInsights && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <Card className="border-primary/20">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
                    Your Profile
                  </p>
                  <p className="text-sm text-txt leading-relaxed">
                    {insights.summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Top themes */}
            {insights.topThemes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Top Themes
                </p>
                <div className="flex flex-wrap gap-2">
                  {insights.topThemes.map((theme) => (
                    <Badge key={theme} className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">
                  Recommendations
                </p>
                <div className="space-y-1.5">
                  {insights.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2"
                    >
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-400" />
                      <p className="text-sm text-txt/80">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function KnowledgeBase() {
  return (
    <div className="space-y-8">
      <AskAISection />
      <div className="border-t border-border" />
      <SemanticSearchSection />
      <div className="border-t border-border" />
      <InsightsSection />
    </div>
  )
}
