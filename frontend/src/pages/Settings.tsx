import { useState, useEffect } from 'react'
import {
  User as UserIcon,
  Clock,
  Globe,
  Bell,
  BellOff,
  Save,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ConnectPlatform } from '../components/ConnectPlatform'
import { InterestGraph } from '../components/InterestGraph'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export default function Settings() {
  const { user, fetchUser } = useAuthStore()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [briefingTime, setBriefingTime] = useState(user?.briefingTime || '08:00')
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      if (user.briefingTime) setBriefingTime(user.briefingTime)
      if (user.timezone) setTimezone(user.timezone)
      if (user.notificationsEnabled !== undefined) setNotifications(user.notificationsEnabled)
    }
  }, [user])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/me', { name, email })
      await fetchUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      await api.patch('/auth/me', {
        briefingTime,
        timezone,
        notificationsEnabled: notifications,
      })
      await fetchUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-xl font-bold text-txt">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-txt">Profile</h2>
        </div>
        <Card className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-txt">{name || 'Your Name'}</p>
              <p className="text-xs text-muted">{email}</p>
            </div>
          </div>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            <Save className="h-3.5 w-3.5" />
            {saved ? 'Saved' : 'Save Profile'}
          </Button>
        </Card>
      </section>

      {/* Connected Platforms */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-txt">Connected Platforms</h2>
        <ConnectPlatform />
      </section>

      {/* Interests */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-txt">Your Interests</h2>
        <InterestGraph />
      </section>

      {/* Briefing time & preferences */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-txt">Briefing Schedule</h2>
        </div>
        <Card className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-txt">Briefing Time</label>
            <input
              type="time"
              value={briefingTime}
              onChange={(e) => setBriefingTime(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-txt flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notifications ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted" />
              )}
              <div>
                <p className="text-sm font-medium text-txt">Notifications</p>
                <p className="text-xs text-muted">
                  Get notified when your briefing is ready
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notifications ? 'bg-primary' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  notifications && 'translate-x-5'
                )}
              />
            </button>
          </div>

          <Button onClick={handleSavePreferences} disabled={saving} size="sm">
            <Save className="h-3.5 w-3.5" />
            {saved ? 'Saved' : 'Save Preferences'}
          </Button>
        </Card>
      </section>
    </div>
  )
}
