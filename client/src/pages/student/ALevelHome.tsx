import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useStudentSessions from '@/hooks/useStudentSessions'
import useGroupSessions from '@/hooks/useGroupSessions'
import useWorkshops from '@/hooks/useWorkshops'
import GroupSessionCard from '@/components/sessions/GroupSessionCard'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-success/10 text-success text-xs px-2 py-1 rounded-full font-medium',
  PENDING:   'bg-warning/10 text-warning text-xs px-2 py-1 rounded-full font-medium',
  COMPLETED: 'bg-border text-muted text-xs px-2 py-1 rounded-full font-medium',
  CANCELLED: 'bg-error/10 text-error text-xs px-2 py-1 rounded-full font-medium',
}

const ALevelHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { sessions: allSessions, loading: sessionsLoading } = useStudentSessions()
  const { sessions: groupSessions, loading: gsLoading } = useGroupSessions(2)
  const { workshops, loading: wsLoading } = useWorkshops({ limit: 2 })

  const firstName = user?.student?.firstName ?? 'there'
  const combination = user?.student?.combination ?? 'A-Level'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  })

  const now = new Date()
  const upcomingSessions = allSessions
    .filter(
      (s) =>
        (s.status === 'CONFIRMED' || s.status === 'PENDING') &&
        new Date(s.scheduledAt) > now,
    )
    .slice(0, 2)

  const upcomingCount = dashboard?.upcomingSessions.length ?? 0
  const workshopsCount = dashboard?.registeredWorkshops.length ?? 0
  const confidenceScore = dashboard?.latestConfidence?.score ?? null

  return (
    <div className="p-6 space-y-8">
      {/* Greeting */}
      <div className="flex items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full mt-1">
          {combination}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {dashLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError ? '—' : upcomingCount}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError ? '—' : workshopsCount}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Workshops Registered</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError || confidenceScore === null ? '—' : `${confidenceScore}/5`}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Career Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming sessions (col-span-2) */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-primary">Upcoming sessions</h2>
            <Link to="/student/sessions" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-border rounded-xl h-20" />
              <div className="animate-pulse bg-border rounded-xl h-20" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted">No upcoming sessions.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const pro = session.professional
                const initials = pro
                  ? `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
                  : '??'
                const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })
                const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                })
                return (
                  <div
                    key={session.id}
                    className="bg-surface rounded-xl border border-border p-4 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">
                        {pro ? `${pro.firstName} ${pro.lastName}` : 'Session'}
                      </p>
                      {pro && <p className="text-xs text-muted">{pro.jobTitle}</p>}
                      <p className="text-xs text-muted mt-1">{date} · {time}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={STATUS_STYLES[session.status] ?? STATUS_STYLES['PENDING']}>
                        {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                      </span>
                      <button className="text-xs text-accent hover:underline">Reschedule</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Workshops for you (col-span-1) */}
        <div>
          <h2 className="text-base font-semibold text-primary mb-4">Workshops for you</h2>
          {wsLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-border rounded-xl h-28" />
              <div className="animate-pulse bg-border rounded-xl h-28" />
            </div>
          ) : workshops.length === 0 ? (
            <p className="text-sm text-muted">No workshops available.</p>
          ) : (
            <div className="space-y-3">
              {workshops.map((ws) => {
                const date = new Date(ws.scheduledAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })
                return (
                  <div
                    key={ws.id}
                    className="bg-surface rounded-xl border border-border p-4"
                  >
                    <p className="text-xs font-semibold text-accent">{ws.company.companyName}</p>
                    <p className="text-sm font-semibold text-primary mt-1">{ws.title}</p>
                    <p className="text-xs text-muted mt-1">{date}</p>
                    <p className="text-xs text-muted">
                      {ws.format === 'ONLINE' ? 'Online' : ws.location ?? 'Location TBD'}
                    </p>
                    <button className="mt-3 bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                      Register
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Group sessions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary">Upcoming group sessions</h2>
          <Link to="/student/sessions" className="text-sm text-accent hover:underline">
            View all sessions
          </Link>
        </div>

        {gsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="animate-pulse bg-border rounded-xl h-44" />
            <div className="animate-pulse bg-border rounded-xl h-44" />
          </div>
        ) : groupSessions.length === 0 ? (
          <p className="text-sm text-muted">No upcoming group sessions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupSessions.map((gs) => (
              <GroupSessionCard key={gs.id} session={gs} />
            ))}
          </div>
        )}
      </section>

      {/* Featured workshops */}
      <section>
        <h2 className="text-base font-semibold text-primary mb-4">Featured workshops this week</h2>
        {wsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-40" />
            ))}
          </div>
        ) : workshops.length === 0 ? (
          <p className="text-sm text-muted">No workshops this week.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workshops.slice(0, 3).map((ws) => {
              const date = new Date(ws.scheduledAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              })
              const slotsLeft = ws.maxRegistrations
                ? ws.maxRegistrations - ws._count.registrations
                : null
              return (
                <div
                  key={ws.id}
                  className="rounded-xl p-5 text-white"
                  style={{ backgroundColor: '#0F2B46' }}
                >
                  <p className="text-xs text-white/70 uppercase tracking-wide">
                    {ws.company.companyName}
                  </p>
                  <p className="text-sm font-bold text-white mt-2">{ws.title}</p>
                  <p className="text-xs text-white/70 mt-2">{date}</p>
                  <p className="text-xs text-white/60">
                    {ws.format === 'ONLINE' ? 'Online' : ws.location ?? 'Location TBD'}
                  </p>
                  {slotsLeft !== null && (
                    <p className="text-xs text-white/60 mt-1">{slotsLeft} spots remaining</p>
                  )}
                  <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg mt-3 transition-colors">
                    Register
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ALevelHome
