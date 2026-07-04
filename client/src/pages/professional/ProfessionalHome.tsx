import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import MentorApplicationSection from '@/components/professional/MentorApplicationSection'
import CreateGroupSessionModal from '@/components/professional/CreateGroupSessionModal'

interface GroupSession {
  id: string
  title: string
  scheduledAt: string
  maxStudents: number
  status: string
  joinLink?: string
  isCancelled?: boolean
  _count?: { enrolments: number }
}

interface MenteeSession {
  id: string
  scheduledAt: string
  type: string
  status: string
  student: { id: string; firstName: string; lastName: string }
}

const ProfessionalHome = () => {
  const { user } = useAuth()
  const isMentor = user?.professional?.isMentor ?? false

  const [gsCompletedCount, setGsCompletedCount] = useState<number | null>(null)
  const [gsUpcomingCount, setGsUpcomingCount] = useState<number | null>(null)
  const [upcomingGroupSessions, setUpcomingGroupSessions] = useState<GroupSession[]>([])
  const [gsLoading, setGsLoading] = useState(true)

  const [oneOnOneCompletedCount, setOneOnOneCompletedCount] = useState<number | null>(null)
  const [oneOnOneUpcomingCount, setOneOnOneUpcomingCount] = useState<number | null>(null)
  const [upcomingMenteeSessions, setUpcomingMenteeSessions] = useState<MenteeSession[]>([])
  const [menteeLoading, setMenteeLoading] = useState(true)

  const [sessionTab, setSessionTab] = useState<'Group Sessions' | 'Mentor Sessions'>('Group Sessions')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [resubmitFields, setResubmitFields] = useState({
    bio: '',
    jobTitle: '',
    employer: '',
    sector: '',
    linkedinUrl: '',
  })
  const [resubmitting, setResubmitting] = useState(false)

  const handleOpenResubmit = () => {
    setResubmitFields({
      bio: user?.professional?.bio ?? '',
      jobTitle: user?.professional?.jobTitle ?? '',
      employer: user?.professional?.employer ?? '',
      sector: user?.professional?.sector ?? '',
      linkedinUrl: user?.professional?.linkedinUrl ?? '',
    })
    setShowResubmitModal(true)
  }

  const handleResubmit = async () => {
    setResubmitting(true)
    try {
      await api.post('/professionals/me/reapply', resubmitFields)
      toast.success('Application resubmitted.')
      globalThis.location.reload()
    } catch {
      toast.error('Could not resubmit. Please try again.')
    } finally {
      setResubmitting(false)
    }
  }

  const fetchGroupSessions = () => {
    api.get('/group-sessions/me').then(({ data }) => {
      const raw: GroupSession[] = data.data.sessions ?? data.data ?? []
      const unique = Array.from(new Map(raw.map(s => [s.id, s])).values())
      const now = new Date()
      setGsCompletedCount(unique.filter(s => new Date(s.scheduledAt) < now).length)
      const upcoming = unique.filter(s => new Date(s.scheduledAt) > now && !s.isCancelled)
      setGsUpcomingCount(upcoming.length)
      setUpcomingGroupSessions(upcoming.slice(0, 4))
    }).catch(() => {}).finally(() => setGsLoading(false))
  }

  useEffect(() => {
    fetchGroupSessions()

    if (isMentor) {
      api.get('/sessions?limit=1000').then(({ data }) => {
        const sessions: MenteeSession[] = data.data.sessions ?? []
        const now = new Date()
        setOneOnOneCompletedCount(sessions.filter(s => new Date(s.scheduledAt) < now).length)
        const upcoming = sessions.filter(
          s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status)
        )
        setOneOnOneUpcomingCount(upcoming.length)
        setUpcomingMenteeSessions(upcoming.slice(0, 4))
      }).catch(() => {}).finally(() => setMenteeLoading(false))
    }
  }, [isMentor])

  if (user?.professional && !user.professional.isVerified) {
    const isRejected = user.professional.verificationStatus === 'REJECTED'
    const verificationAttempts = user.professional.verificationAttempts ?? 0

    return (
      <div className="p-6 space-y-6">
        {showResubmitModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <dialog open aria-labelledby="resubmit-title" className="bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6 m-0 border-0 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 id="resubmit-title" className="text-base font-bold text-primary">Resubmit Application</h2>
                <button onClick={() => setShowResubmitModal(false)} className="text-muted hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted mb-5">Update your profile details and resubmit for admin review.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="rs-bio" className="text-xs font-semibold text-muted uppercase tracking-wide">Bio</label>
                  <textarea
                    id="rs-bio"
                    value={resubmitFields.bio}
                    onChange={(e) => setResubmitFields((f) => ({ ...f, bio: e.target.value }))}
                    rows={4}
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rs-jobtitle" className="text-xs font-semibold text-muted uppercase tracking-wide">Job Title</label>
                    <input
                      id="rs-jobtitle"
                      value={resubmitFields.jobTitle}
                      onChange={(e) => setResubmitFields((f) => ({ ...f, jobTitle: e.target.value }))}
                      className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="rs-employer" className="text-xs font-semibold text-muted uppercase tracking-wide">Employer</label>
                    <input
                      id="rs-employer"
                      value={resubmitFields.employer}
                      onChange={(e) => setResubmitFields((f) => ({ ...f, employer: e.target.value }))}
                      className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="rs-sector" className="text-xs font-semibold text-muted uppercase tracking-wide">Sector</label>
                  <input
                    id="rs-sector"
                    value={resubmitFields.sector}
                    onChange={(e) => setResubmitFields((f) => ({ ...f, sector: e.target.value }))}
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                  />
                </div>
                <div>
                  <label htmlFor="rs-linkedin" className="text-xs font-semibold text-muted uppercase tracking-wide">LinkedIn URL</label>
                  <input
                    id="rs-linkedin"
                    value={resubmitFields.linkedinUrl}
                    onChange={(e) => setResubmitFields((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <button
                  onClick={() => setShowResubmitModal(false)}
                  className="px-4 py-2 text-sm text-muted hover:text-primary border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResubmit}
                  disabled={resubmitting || !resubmitFields.bio.trim()}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  {resubmitting ? 'Submitting…' : 'Resubmit'}
                </button>
              </div>
            </dialog>
          </div>
        )}
        {isRejected ? (
          verificationAttempts >= 3 ? (
            <div className="bg-error/10 border border-error/20 rounded-xl p-5">
              <p className="text-sm font-semibold text-error">Not eligible to apply</p>
              <p className="text-xs text-muted mt-1">You have reached the maximum number of verification submissions (3) and are no longer eligible to apply.</p>
            </div>
          ) : (
            <div className="bg-error/10 border border-error/20 rounded-xl p-5">
              <p className="text-sm font-semibold text-error">Your application was declined</p>
              {user.professional.rejectionReason && (
                <p className="text-xs text-muted mt-1">{user.professional.rejectionReason}</p>
              )}
              <button
                onClick={handleOpenResubmit}
                className="mt-3 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Resubmit for review
              </button>
            </div>
          )
        ) : (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-primary">Your account is under review</p>
            <p className="text-xs text-muted mt-1">Our team is verifying your LinkedIn profile and background. You'll receive an email once approved.</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none">
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

  const typeLabel = (type: string) => {
    if (type === 'FREE_INTRO') return 'Free Intro'
    if (type === 'PRO') return 'Pro'
    return 'Premium'
  }

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
      <div className={`grid gap-4 ${isMentor ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
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
        <div className="flex items-center justify-between mb-4">
          {isMentor ? (
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
              {(['Group Sessions', 'Mentor Sessions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSessionTab(tab)}
                  className={sessionTab === tab
                    ? 'bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium'
                    : 'text-muted hover:text-primary px-4 py-1.5 rounded-lg text-sm transition-colors'
                  }
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
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
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
            setGsLoading(true)
            fetchGroupSessions()
          }}
        />
      )}
    </div>
  )
}

export default ProfessionalHome
