import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import CreateGroupSessionModal from '@/components/professional/CreateGroupSessionModal'
import EditGroupSessionModal from '@/components/professional/EditGroupSessionModal'
import {
  professionalDashboardKeys,
  useGroupSessionsMeQuery,
  useMenteeSessionsQuery,
  type GroupSession,
  type MenteeSession,
} from '@/hooks/queries/professionalDashboardQueries'

const sessionGrid = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'

const SkeletonGrid = () => (
  <div className={sessionGrid}>
    {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-border rounded-xl h-24" />)}
  </div>
)

const typeLabel = (_type: string) => 'Session'

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    CONFIRMED: 'bg-success/10 text-success',
    COMPLETED: 'bg-accent/10 text-accent',
    CANCELLED: 'bg-error/10 text-error',
    PENDING: 'bg-warning/10 text-warning',
  }
  return map[status] ?? 'bg-border text-muted'
}

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
    {tabs.map(t => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={(active === t
          ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
          : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors'
        ) + ' whitespace-nowrap'}
      >
        {t}
      </button>
    ))}
  </div>
)

const ProfessionalSessions = () => {
  const { user } = useAuth()
  const isMentor = user?.professional?.isMentor ?? false
  const queryClient = useQueryClient()

  const [categoryTab, setCategoryTab] = useState<'Group Sessions' | 'Mentee Sessions'>('Group Sessions')
  const [timeTab, setTimeTab] = useState<'Upcoming' | 'Past'>('Upcoming')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSession, setEditingSession] = useState<GroupSession | null>(null)

  const { data: groupSessions = [], isLoading: gsLoading } = useGroupSessionsMeQuery()
  const { data: menteeSessions = [], isLoading: menteeLoading } = useMenteeSessionsQuery(isMentor)

  const invalidateGroupSessions = () =>
    queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.groupSessionsMe })

  const now = new Date()

  const upcomingGS = groupSessions.filter(s => new Date(s.scheduledAt) > now && !s.isCancelled)
  const pastGS = groupSessions.filter(s => new Date(s.scheduledAt) <= now || s.isCancelled)

  const upcomingMentee = menteeSessions.filter(
    s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status)
  )
  const pastMentee = menteeSessions.filter(
    s => new Date(s.scheduledAt) <= now || ['COMPLETED', 'CANCELLED'].includes(s.status)
  )

  const renderGroupCard = (gs: GroupSession, editable: boolean) => {
    const date = new Date(gs.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const time = new Date(gs.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return (
      <div key={gs.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary truncate">{gs.title}</p>
        <p className="text-xs text-muted">{date} · {time}</p>
        <p className="text-xs text-muted">{gs._count?.enrolments ?? 0}/{gs.maxStudents} enrolled</p>
        {editable && (
          <div className="flex items-center gap-2 mt-auto pt-1">
            {gs.joinLink && (
              <a href={gs.joinLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">Join →</a>
            )}
            <button
              onClick={() => setEditingSession(gs)}
              className="border border-border text-primary text-xs px-2 py-1 rounded-lg hover:bg-background transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderMenteeCard = (s: MenteeSession) => {
    const date = new Date(s.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const time = new Date(s.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    return (
      <div key={s.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary">{s.student.firstName} {s.student.lastName}</p>
        <p className="text-xs text-muted">{date} · {time}</p>
        <p className="text-xs text-muted">{s.duration} min</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{typeLabel(s.type)}</span>
          {s.status !== 'PENDING' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(s.status)}`}>
              {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderGroupContent = (sessions: GroupSession[], emptyMsg: string, editable: boolean) => {
    if (gsLoading) return <SkeletonGrid />
    if (sessions.length === 0) return <p className="text-sm text-muted">{emptyMsg}</p>
    return <div className={sessionGrid}>{sessions.map(gs => renderGroupCard(gs, editable))}</div>
  }

  const renderMenteeContent = (sessions: MenteeSession[], emptyMsg: string) => {
    if (menteeLoading) return <SkeletonGrid />
    if (sessions.length === 0) return <p className="text-sm text-muted">{emptyMsg}</p>
    return <div className={sessionGrid}>{sessions.map(s => renderMenteeCard(s))}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-primary">Sessions</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          Create Group Session +
        </button>
      </div>

      {isMentor && (
        <TabBar
          tabs={['Group Sessions', 'Mentee Sessions']}
          active={categoryTab}
          onChange={(t) => { setCategoryTab(t as typeof categoryTab); setTimeTab('Upcoming') }}
        />
      )}

      <TabBar
        tabs={['Upcoming', 'Past']}
        active={timeTab}
        onChange={(t) => setTimeTab(t as typeof timeTab)}
      />

      {(!isMentor || categoryTab === 'Group Sessions') && (
        timeTab === 'Upcoming'
          ? renderGroupContent(upcomingGS, 'No upcoming group sessions.', true)
          : renderGroupContent(pastGS, 'No past group sessions.', false)
      )}

      {isMentor && categoryTab === 'Mentee Sessions' && (
        timeTab === 'Upcoming'
          ? renderMenteeContent(upcomingMentee, 'No upcoming mentee sessions.')
          : renderMenteeContent(pastMentee, 'No past mentee sessions.')
      )}

      {showCreateModal && (
        <CreateGroupSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            invalidateGroupSessions()
          }}
        />
      )}

      {editingSession && (
        <EditGroupSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSuccess={invalidateGroupSessions}
        />
      )}
    </div>
  )
}

export default ProfessionalSessions
