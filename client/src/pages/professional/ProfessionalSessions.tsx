import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/AuthContext'
import useProfessionalSessions from '@/hooks/useProfessionalSessions'
import CreateGroupSessionModal from '@/components/professional/CreateGroupSessionModal'
import GroupSessionCard, { GroupSessionData } from '@/components/sessions/GroupSessionCard'

const TYPE_BADGE: Record<string, string> = {
  FREE_INTRO: 'bg-accent/10 text-accent',
  PRO:        'bg-warning/10 text-warning',
  PREMIUM:    'bg-success/10 text-success',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Quota {
  used: number
  total: number
  renewalDate: string
}

const ProfessionalSessions = () => {
  const { user } = useAuth()
  if (user?.professional?.isVerified === false) {
    return <Navigate to="/professional/home" replace />
  }

  const [tab, setTab] = useState<'upcoming' | 'past' | 'group'>('upcoming')
  const [showModal, setShowModal] = useState(false)

  const { sessions: confirmed, loading: upcomingLoading } = useProfessionalSessions({ status: 'CONFIRMED' })
  const { sessions: completed, loading: pastLoading } = useProfessionalSessions({ status: 'COMPLETED' })
  const { sessions: allSessions } = useProfessionalSessions()

  const [groupSessions, setGroupSessions] = useState<GroupSessionData[]>([])
  const [gsLoading, setGsLoading] = useState(true)
  const [gsTick, setGsTick] = useState(0)

  const [quota, setQuota] = useState<Quota | null>(null)

  useEffect(() => {
    api.get('/group-sessions/me')
      .then(({ data }) => setGroupSessions(data.data.sessions ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setGsLoading(false))
  }, [gsTick])

  useEffect(() => {
    api.get('/professionals/me/quota')
      .then(({ data }) => setQuota(data.data))
      .catch(() => {})
  }, [])

  const handleConnectCalendar = async () => {
    try {
      const { data } = await api.get('/google-calendar/auth')
      window.open(data.data.url, '_blank')
    } catch {}
  }

  const now = new Date()

  const upcomingSessions = confirmed.filter((s) => new Date(s.scheduledAt) > now)
  const uniqueStudents = new Set(allSessions.map((s) => s.student.id)).size
  const activeGroupCount = groupSessions.filter((gs) => new Date(gs.scheduledAt) > now).length

  // Derive which weekdays have confirmed sessions
  const sessionDays = new Set(
    upcomingSessions.map((s) => {
      const d = new Date(s.scheduledAt).getDay()
      return d === 0 ? 6 : d - 1 // convert Sun=0 to Mon=0 index
    })
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Sessions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create Group Session +
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 mt-4 flex-wrap">
        <span className="bg-surface border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          {upcomingSessions.length} Upcoming
        </span>
        <span className="bg-surface border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          {uniqueStudents} Students
        </span>
        <span className="bg-surface border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          {activeGroupCount} Active Group Sessions
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['upcoming', 'past', 'group'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t
              ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
              : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors'
            }
          >
            {t === 'upcoming' ? 'Upcoming' : t === 'past' ? 'Past' : 'Group Sessions'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Session list */}
        <div className="lg:col-span-2">
          {tab === 'upcoming' && (
            <>
              {upcomingLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse bg-border rounded-xl h-24" />
                  <div className="animate-pulse bg-border rounded-xl h-24" />
                </div>
              ) : upcomingSessions.length === 0 ? (
                <p className="text-sm text-muted">No upcoming sessions.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => {
                    const initials =
                      `${session.student.firstName[0] ?? ''}${session.student.lastName[0] ?? ''}`.toUpperCase()
                    const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })
                    const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })
                    return (
                      <div key={session.id} className="bg-surface rounded-xl border border-border p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">
                            {session.student.firstName} {session.student.lastName}
                          </p>
                          <p className="text-xs text-muted">
                            {session.student.level.replace('_', '-')}
                            {session.student.combination ? ` · ${session.student.combination}` : ''}
                          </p>
                          <p className="text-xs text-muted mt-1">{date} · {time}</p>
                          {session.meetLink && (
                            <a href={session.meetLink} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                              Join Call
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[session.type] ?? ''}`}>
                            {session.type.replace('_', ' ')}
                          </span>
                          <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg">
                            Start Session
                          </button>
                          <button className="border border-border text-muted text-xs px-3 py-1.5 rounded-lg">
                            Reschedule
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'past' && (
            <>
              {pastLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse bg-border rounded-xl h-24" />
                  <div className="animate-pulse bg-border rounded-xl h-24" />
                </div>
              ) : completed.length === 0 ? (
                <p className="text-sm text-muted">No past sessions.</p>
              ) : (
                <div className="space-y-3">
                  {completed.map((session) => {
                    const initials =
                      `${session.student.firstName[0] ?? ''}${session.student.lastName[0] ?? ''}`.toUpperCase()
                    const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })
                    const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })
                    return (
                      <div key={session.id} className="bg-surface rounded-xl border border-border p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">
                            {session.student.firstName} {session.student.lastName}
                          </p>
                          <p className="text-xs text-muted">
                            {session.student.level.replace('_', '-')}
                            {session.student.combination ? ` · ${session.student.combination}` : ''}
                          </p>
                          <p className="text-xs text-muted mt-1">{date} · {time}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[session.type] ?? ''}`}>
                            {session.type.replace('_', ' ')}
                          </span>
                          <button className="border border-border text-muted text-xs px-3 py-1.5 rounded-lg">
                            Add Notes
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'group' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Group Session +
                </button>
              </div>
              {gsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="animate-pulse bg-border rounded-xl h-44" />
                  <div className="animate-pulse bg-border rounded-xl h-44" />
                </div>
              ) : groupSessions.length === 0 ? (
                <p className="text-sm text-muted">You have not created any group sessions yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupSessions.map((gs) => (
                    <GroupSessionCard key={gs.id} session={gs} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quota + schedule panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-primary">Session quota</p>
            {quota && (
              <>
                <div className="mt-3">
                  <div className="bg-border rounded-full h-2">
                    <div
                      className="bg-accent rounded-full h-2 transition-all"
                      style={{ width: `${Math.min((quota.used / quota.total) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">{quota.used} of {quota.total} sessions used this month</p>
                </div>
                <p className="text-xs text-muted mt-2">
                  Renewal date: {new Date(quota.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </>
            )}
            <button
              onClick={handleConnectCalendar}
              className="text-xs text-accent hover:underline mt-3 block"
            >
              Edit Availability →
            </button>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-sm font-semibold text-primary mb-3">Your schedule this week</p>
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={`flex-1 rounded text-center py-1.5 text-xs font-medium ${
                    sessionDays.has(i) ? 'bg-accent text-white' : 'bg-border text-muted'
                  }`}
                >
                  {day[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateGroupSessionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setGsTick((t) => t + 1)}
        />
      )}
    </div>
  )
}

export default ProfessionalSessions
