import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PenSquare, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { PostGenerator } from '../components/PostGenerator'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { usePostStore } from '../store/postStore'
import { useLibraryStore } from '../store/libraryStore'

export default function Studio() {
  const location = useLocation()
  const state = location.state as {
    sourceItemId?: string
    sourceTitle?: string
    sourceSummary?: string
  } | null

  const [selectedSource, setSelectedSource] = useState<{
    id: string
    title: string
    summary: string
  } | null>(
    state?.sourceItemId
      ? {
          id: state.sourceItemId,
          title: state.sourceTitle || '',
          summary: state.sourceSummary || '',
        }
      : null
  )

  const { generatedPosts, fetchRecentPosts } = usePostStore()
  const { items: libraryItems, fetchLibrary } = useLibraryStore()

  useEffect(() => {
    fetchRecentPosts()
    fetchLibrary()
  }, [fetchRecentPosts, fetchLibrary])

  const recentPosts = generatedPosts.slice(0, 6)

  return (
    <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-txt mb-6">Content Studio</h1>

      {selectedSource ? (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSource(null)}
            className="text-muted"
          >
            &larr; Choose different source
          </Button>
          <PostGenerator
            sourceItemId={selectedSource.id}
            sourceTitle={selectedSource.title}
            sourceSummary={selectedSource.summary}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Source picker */}
          <div>
            <h2 className="text-sm font-medium text-muted mb-3">
              Choose a source to create posts from
            </h2>
            {libraryItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted/50 mx-auto mb-3" />
                <p className="text-sm text-muted">
                  No items in your library yet. Save content from your briefing
                  or feed first.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {libraryItems.slice(0, 10).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() =>
                        setSelectedSource({
                          id: item.savedItemId,
                          title: item.title,
                          summary: item.summary,
                        })
                      }
                    >
                      <div className="flex items-start gap-3">
                        <PenSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-txt line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-muted line-clamp-2 mt-1">
                            {item.summary}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {item.topics.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent posts */}
          {recentPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted mb-3">
                Recent Generated Posts
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentPosts.map((post) => (
                  <Card key={post.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          post.platform === 'LINKEDIN'
                            ? 'linkedin'
                            : post.platform === 'TWITTER'
                              ? 'twitter'
                              : 'instagram'
                        }
                      >
                        {post.platform}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted line-clamp-3">
                      {post.content}
                    </p>
                    <p className="text-[10px] text-muted">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
