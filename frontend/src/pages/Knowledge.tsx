import { Brain } from 'lucide-react'
import { KnowledgeBase } from '../components/KnowledgeBase'

export default function Knowledge() {
  return (
    <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-txt">Knowledge Base</h1>
        </div>
        <p className="text-sm text-muted">
          Ask AI about your saved content
        </p>
      </div>
      <KnowledgeBase />
    </div>
  )
}
