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

  const [tab, setTab] = useState<'past' | 'group'>('group')
  const [showModal, setShowModal] = useState(false)

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

  const uniqueGroupSessions = Array.from(
    new Map(groupSessions.map((s) => [s.id, s])).values()
  )

  const now = new Date()

  const uniqueStudents = new Set(allSessions.map((s) => s.student.id)).size
  const activeGroupCount = groupSessions.filter((gs) => new Date(gs.scheduledAt) > now).length

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
          {uniqueStudents} Students
        </span>
        <span className="bg-surface border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          {activeGroupCount} Active Group Sessions
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['past', 'group'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t
              ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
              : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors'
            }
          >
            {t === 'past' ? 'Past' : 'Group Sessions'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Session list */}
        <div className="lg:col-span-2">
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
                  {uniqueGroupSessions.map((gs) => (
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
