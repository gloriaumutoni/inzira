import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import useWorkshops from '@/hooks/useWorkshops'
import GroupSessionCard from '@/components/sessions/GroupSessionCard'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-success/10 text-success text-xs px-2 py-1 rounded-full font-medium',
  PENDING:   'bg-warning/10 text-warning text-xs px-2 py-1 rounded-full font-medium',
  COMPLETED: 'bg-border text-muted text-xs px-2 py-1 rounded-full font-medium',
  CANCELLED: 'bg-error/10 text-error text-xs px-2 py-1 rounded-full font-medium',
}

interface UnifiedSession {
  id: string
  isGroup: boolean
  scheduledAt: string
  status?: string
  title?: string
  professional?: { firstName: string; lastName: string; jobTitle?: string }
  joinLink?: string | null
}

const ALevelHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { sessions: publicGroupSessions, loading: gsLoading } = useGroupSessions(2)
  const { workshops, loading: wsLoading } = useWorkshops({ limit: 2 })
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())

  const firstName = user?.student?.firstName ?? 'there'
  const combination = user?.student?.combination ?? 'A-Level'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  })

  const now = new Date()

  const allUpcoming: UnifiedSession[] = [
    ...(dashboard?.upcomingSessions ?? []).map((s) => ({
      id: s.id,
      isGroup: false,
      scheduledAt: s.scheduledAt,
      status: s.status,
      professional: s.professional,
    })),
    ...(dashboard?.groupSessions ?? []).map((e) => ({
      id: e.groupSession.id,
      isGroup: true,
      scheduledAt: e.groupSession.scheduledAt,
      status: 'CONFIRMED',
      title: e.groupSession.title,
      professional: e.groupSession.professional,
      joinLink: e.groupSession.joinLink,
    })),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)

  const upcomingCount = allUpcoming.filter((s) => new Date(s.scheduledAt) > now).length
  const workshopsCount = dashboard?.registeredWorkshops.length ?? 0
  const confidenceScore = dashboard?.latestConfidence ?? null

  const handleRegisterWorkshop = async (workshopId: string) => {
    setRegisteringId(workshopId)
    try {
      await api.post(`/workshops/${workshopId}/register`)
      setRegisteredIds((prev) => new Set([...prev, workshopId]))
      toast.success('You are registered for this workshop!')
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 409) {
        toast.error('You are already registered for this workshop.')
      } else {
        toast.error('Could not register. Please try again.')
      }
    } finally {
      setRegisteringId(null)
    }
  }

  const showWorkshopsFirst =
    allUpcoming.length === 0 && workshops.length > 0

  const sessionsSection = (
    <div className="lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-primary">Upcoming sessions</h2>
        <Link to="/student/sessions" className="text-sm text-accent hover:underline">
          View all
        </Link>
      </div>

      {dashLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse bg-border rounded-xl h-20" />
          <div className="animate-pulse bg-border rounded-xl h-20" />
        </div>
      ) : allUpcoming.length === 0 ? (
        <div className="text-sm text-muted text-center py-6">
          No upcoming sessions.{' '}
          <Link to="/student/explore-careers" className="text-accent hover:underline">
            Book a free intro from the Discover page.
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allUpcoming.map((session) => {
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
            return (
              <div
                key={`${session.isGroup ? 'g' : 's'}-${session.id}`}
                className="bg-surface rounded-xl border border-border p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-primary">
                      {session.isGroup
                        ? (session.title ?? 'Group Session')
                        : pro ? `${pro.firstName} ${pro.lastName}` : 'Session'}
                    </p>
                    {session.isGroup && (
                      <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">GROUP</span>
                    )}
                  </div>
                  {pro && <p className="text-xs text-muted">{pro.jobTitle}</p>}
                  <p className="text-xs text-muted mt-1">{date} · {time}</p>
                </div>
                <span className={STATUS_STYLES[session.status ?? 'CONFIRMED'] ?? STATUS_STYLES['CONFIRMED']}>
                  {(session.status ?? 'CONFIRMED').charAt(0) + (session.status ?? 'CONFIRMED').slice(1).toLowerCase()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const workshopsSection = (
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
                <button
                  onClick={() => handleRegisterWorkshop(ws.id)}
                  disabled={registeringId === ws.id || registeredIds.has(ws.id)}
                  className={`mt-3 text-xs px-3 py-1.5 rounded-lg transition-colors font-semibold disabled:opacity-60 ${
                    registeredIds.has(ws.id)
                      ? 'bg-success/10 text-success cursor-default'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {registeredIds.has(ws.id) ? 'Registered ✓' : registeringId === ws.id ? 'Registering...' : 'Register'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                {dashError || confidenceScore === null ? '— / 5' : `${confidenceScore} / 5`}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Career Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Two-column section — order depends on content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showWorkshopsFirst ? (
          <>
            {workshopsSection}
            {sessionsSection}
          </>
        ) : (
          <>
            {sessionsSection}
            {workshopsSection}
          </>
        )}
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
        ) : publicGroupSessions.length === 0 ? (
          <p className="text-sm text-muted">No upcoming group sessions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicGroupSessions.map((gs) => (
              <GroupSessionCard key={gs.id} session={gs} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ALevelHome
