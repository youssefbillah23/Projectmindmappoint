import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">PP</span>
          </div>
          <h1 className="text-2xl font-bold text-txt">PulsePoint</h1>
          <p className="text-sm text-muted text-center">
            Your daily content briefing, powered by AI
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
