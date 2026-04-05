import { UnifiedFeed } from '../components/UnifiedFeed'

export default function Feed() {
  return (
    <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-txt mb-6">Your Saves</h1>
      <UnifiedFeed />
    </div>
  )
}
