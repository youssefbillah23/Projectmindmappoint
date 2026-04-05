import { useEffect, useState } from 'react'
import {
  Briefcase,
  AtSign,
  Camera,
  Check,
  RefreshCw,
  Unplug,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Loader } from './ui/Loader'
import { cn } from '../lib/utils'
import { api } from '../lib/api'
import type { Platform, PlatformConnection } from '../types'

const platformConfig: Record<
  Platform,
  {
    icon: typeof Briefcase | typeof AtSign
    label: string
    color: string
    bgColor: string
    borderColor: string
    gradient?: string
  }
> = {
  LINKEDIN: {
    icon: Briefcase,
    label: 'LinkedIn',
    color: 'text-linkedin',
    bgColor: 'bg-linkedin/10',
    borderColor: 'border-linkedin/30',
  },
  TWITTER: {
    icon: AtSign,
    label: 'X / Twitter',
    color: 'text-txt',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
  },
  INSTAGRAM: {
    icon: Camera,
    label: 'Instagram',
    color: 'text-instagram',
    bgColor: 'bg-instagram/10',
    borderColor: 'border-instagram/30',
  },
}

const platforms: Platform[] = ['LINKEDIN', 'TWITTER', 'INSTAGRAM']

export function ConnectPlatform() {
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const data = await api.get<PlatformConnection[]>('/connections')
      setConnections(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (platform: Platform) => {
    window.location.href = `/api/oauth/${platform.toLowerCase()}/connect`
  }

  const handleDisconnect = async (id: string) => {
    try {
      await api.delete(`/connections/${id}`)
      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // ignore
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      await api.post(`/connections/${id}/sync`)
      await fetchConnections()
    } catch {
      // ignore
    } finally {
      setSyncing(null)
    }
  }

  if (loading) return <Loader className="py-8" />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {platforms.map((platform, i) => {
        const config = platformConfig[platform]
        const connection = connections.find((c) => c.platform === platform)
        const Icon = config.icon

        return (
          <motion.div
            key={platform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={cn(
                'border-l-2 space-y-4',
                config.borderColor
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-txt">
                    {config.label}
                  </p>
                  {connection?.platformUsername && (
                    <p className="text-xs text-muted">
                      @{connection.platformUsername}
                    </p>
                  )}
                </div>
                <div className="ml-auto">
                  {connection?.connected ? (
                    <Badge variant="success">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not connected</Badge>
                  )}
                </div>
              </div>

              {connection?.connected ? (
                <div className="space-y-3">
                  {connection.lastSyncAt && (
                    <p className="text-xs text-muted">
                      Last synced{' '}
                      {new Date(connection.lastSyncAt).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(connection.id)}
                      disabled={syncing === connection.id}
                      className="flex-1"
                    >
                      <RefreshCw
                        className={cn(
                          'h-3.5 w-3.5',
                          syncing === connection.id && 'animate-spin'
                        )}
                      />
                      {syncing === connection.id ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(platform)}
                  className="w-full"
                  size="sm"
                >
                  Connect {config.label}
                </Button>
              )}
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
