import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import MentorApplicationSection from '@/components/professional/MentorApplicationSection'
import CreateGroupSessionModal from '@/components/professional/CreateGroupSessionModal'
import {
  professionalDashboardKeys,
  useGroupSessionsMeQuery,
  useMenteeSessionsQuery,
} from '@/hooks/queries/professionalDashboardQueries'

const ProfessionalHome = () => {
  const { user } = useAuth()
  const isMentor = user?.professional?.isMentor ?? false
  const queryClient = useQueryClient()

  const { data: groupSessions = [], isLoading: gsLoading } = useGroupSessionsMeQuery()
  const { data: menteeSessions = [], isLoading: menteeLoading } = useMenteeSessionsQuery(isMentor)

  const now = new Date()
  const gsCompletedCount = groupSessions.filter(s => new Date(s.scheduledAt) < now).length
  const upcomingGroupSessions = groupSessions
    .filter(s => new Date(s.scheduledAt) > now && !s.isCancelled)
    .slice(0, 4)
  const gsUpcomingCount = groupSessions.filter(s => new Date(s.scheduledAt) > now && !s.isCancelled).length

  const oneOnOneCompletedCount = menteeSessions.filter(s => new Date(s.scheduledAt) < now).length
  const upcomingMenteeSessions = menteeSessions
    .filter(s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status))
    .slice(0, 4)
  const oneOnOneUpcomingCount = menteeSessions.filter(
    s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status)
  ).length

  const [sessionTab, setSessionTab] = useState<'Group Sessions' | 'Mentor Sessions'>('Group Sessions')
  const [showCreateModal, setShowCreateModal] = useState(false)

  if (user?.professional && !user.professional.isVerified) {
    const isRejected = user.professional.verificationStatus === 'REJECTED'

    return (
      <div className="p-6 space-y-6">
        {isRejected ? (
          <div className="bg-error/10 border border-error/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-error">Request to become Professional declined</p>
            {user.professional.rejectionReason && (
              <p className="text-xs text-muted mt-1">Reason: {user.professional.rejectionReason}</p>
            )}
          </div>
        ) : (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-primary">Your account is under review</p>
            <p className="text-xs text-muted mt-1">Our team is verifying your LinkedIn profile and background. You'll receive an email once approved.</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40 pointer-events-none">
          {['GROUP SESSIONS COMPLETED', 'UPCOMING GROUP SESSIONS'].map(label => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-border">—</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sessionGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'

  const typeLabel = (_type: string) => 'Session'

  const renderGroupSessions = () => {
    if (gsLoading) return (
      <div className={sessionGridClass}>
        {[1, 2].map(i => <div key={i} className="animate-pulse bg-border rounded-xl h-24" />)}
      </div>
    )
    if (upcomingGroupSessions.length === 0) return <p className="text-sm text-muted">No upcoming group sessions.</p>
    return (
      <div className={sessionGridClass}>
        {upcomingGroupSessions.map(session => {
          const date = new Date(session.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const enrolled = session._count?.enrolments ?? 0
          return (
            <div key={session.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary truncate">{session.title}</p>
              <p className="text-xs text-muted">{date} · {time}</p>
              <p className="text-xs text-muted">{enrolled}/{session.maxStudents} enrolled</p>
              {session.joinLink && (
                <a href={session.joinLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-auto">Join →</a>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMenteeSessions = () => {
    if (menteeLoading) return (
      <div className={sessionGridClass}>
        {[1, 2].map(i => <div key={i} className="animate-pulse bg-border rounded-xl h-24" />)}
      </div>
    )
    if (upcomingMenteeSessions.length === 0) return <p className="text-sm text-muted">No upcoming mentee sessions.</p>
    return (
      <div className={sessionGridClass}>
        {upcomingMenteeSessions.map(session => {
          const date = new Date(session.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={session.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary">{session.student.firstName} {session.student.lastName}</p>
              <p className="text-xs text-muted">{date} · {time}</p>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full w-fit">{typeLabel(session.type)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Welcome back, {user?.professional?.firstName}</h1>
        <p className="text-sm text-muted mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isMentor ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div className="bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{gsCompletedCount ?? '—'}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">GROUP SESSIONS COMPLETED</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{gsUpcomingCount ?? '—'}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">UPCOMING GROUP SESSIONS</p>
        </div>
        {isMentor && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{oneOnOneCompletedCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">1-ON-1 SESSIONS COMPLETED</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{oneOnOneUpcomingCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">UPCOMING 1-ON-1 SESSIONS</p>
            </div>
          </>
        )}
      </div>

      {/* Sessions section with tabs (mentor) or plain (non-mentor) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          {isMentor ? (
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
              {(['Group Sessions', 'Mentor Sessions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSessionTab(tab)}
                  className={(sessionTab === tab
                    ? 'bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium'
                    : 'text-muted hover:text-primary px-4 py-1.5 rounded-lg text-sm transition-colors'
                  ) + ' whitespace-nowrap'}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <h2 className="text-base font-semibold text-primary">Upcoming Group Sessions</h2>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0 self-start sm:self-auto"
          >
            Create Session
          </button>
        </div>

        {(!isMentor || sessionTab === 'Group Sessions') && renderGroupSessions()}

        {isMentor && sessionTab === 'Mentor Sessions' && renderMenteeSessions()}
      </div>

      {user?.professional?.isVerified && !isMentor && (
        <MentorApplicationSection />
      )}

      {showCreateModal && (
        <CreateGroupSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.groupSessionsMe })
          }}
        />
      )}
    </div>
  )
}

export default ProfessionalHome
