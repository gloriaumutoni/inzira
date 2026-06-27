import { Link } from 'react-router-dom'
import useStudentSessions from '@/hooks/useStudentSessions'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-success/10 text-success text-xs px-2 py-1 rounded-full font-medium',
  PENDING:   'bg-warning/10 text-warning text-xs px-2 py-1 rounded-full font-medium',
  COMPLETED: 'bg-border text-muted text-xs px-2 py-1 rounded-full font-medium',
  CANCELLED: 'bg-error/10 text-error text-xs px-2 py-1 rounded-full font-medium',
}

const TIPS = [
  'Prepare 2–3 specific questions you want answered',
  "Research the professional's background before the session",
  'Take notes during the call and follow up afterwards',
  'Be honest about where you are in your career thinking',
]

const SessionSkeleton = () => (
  <div className="animate-pulse bg-surface rounded-xl border border-border p-4 flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-border rounded w-1/3" />
      <div className="h-3 bg-border rounded w-1/2" />
    </div>
  </div>
)

const StudentSessions = () => {
  const { sessions, loading, error } = useStudentSessions()

  const now = new Date()
  const upcomingCount = sessions.filter(
    (s) =>
      (s.status === 'CONFIRMED' || s.status === 'PENDING') &&
      new Date(s.scheduledAt) > now,
  ).length
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Sessions</h1>
          <p className="text-sm text-muted mt-1">
            Manage your sessions and messages with career guides.
          </p>
        </div>
        <Link
          to="/student/discover"
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          Find a professional
        </Link>
      </div>

      {/* Stats pills */}
      {!loading && (
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{sessions.length}</span>
            <span className="text-xs text-muted">Total</span>
          </div>
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{upcomingCount}</span>
            <span className="text-xs text-muted">Upcoming</span>
          </div>
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{completedCount}</span>
            <span className="text-xs text-muted">Completed</span>
          </div>
        </div>
      )}

      <div className="flex gap-6 mt-6">
        {/* Sessions list */}
        <div className="flex-1 space-y-4">
          {loading ? (
            <>
              <SessionSkeleton />
              <SessionSkeleton />
              <SessionSkeleton />
            </>
          ) : error ? (
            <p className="text-sm text-muted text-center py-8">Unable to load. Please try again.</p>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted">No sessions yet.</p>
              <p className="text-sm text-muted mt-1">
                Book a free intro with a professional to get started.{' '}
                <Link to="/student/discover" className="text-accent hover:underline">
                  Find one here
                </Link>
              </p>
            </div>
          ) : (
            sessions
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
              )
              .map((session) => {
                const pro = session.professional
                const initials = pro
                  ? `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
                  : 'GS'
                const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })
                const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                })
                const typeLabel = session.type.replace('_', ' ')
                return (
                  <div
                    key={session.id}
                    className="bg-surface rounded-xl border border-border p-4 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">
                        {pro ? `${pro.firstName} ${pro.lastName}` : 'Group Session'}
                      </p>
                      {pro && <p className="text-xs text-muted">{pro.jobTitle}</p>}
                      <p className="text-xs text-muted mt-1">{date} · {time}</p>
                      <p className="text-xs text-muted">{session.duration} min · {typeLabel}</p>
                    </div>
                    <span className={STATUS_STYLES[session.status] ?? STATUS_STYLES['PENDING']}>
                      {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                )
              })
          )}
        </div>

        {/* Tips panel */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-primary">Session tips</h3>
            <div className="space-y-3 mt-3">
              {TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-xs text-muted">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default StudentSessions
