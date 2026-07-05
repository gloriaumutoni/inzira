import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useConfidenceLogs from '@/hooks/useConfidenceLogs'
import ManualConfidenceModal from '@/components/student/ManualConfidenceModal'
import CombinationConfidenceChart from '@/components/student/CombinationConfidenceChart'
import { api } from '@/api/axios'

interface MentorSlot {
  id: string
  scheduledAt: string
  durationMins: number
  meetLink: string | null
  Professional: { id: string; firstName: string; lastName: string; jobTitle: string }
}

interface GroupSession {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  sector: string
  combinations: string[]
  maxStudents: number
  joinLink?: string
  professional: { id: string; firstName: string; lastName: string; jobTitle?: string }
  _count: { enrolments: number }
}

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

const StudentHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { byCombo, refetch: refetchLogs } = useConfidenceLogs()
  const [showManualLog, setShowManualLog] = useState(false)
  const [mentorSlots, setMentorSlots] = useState<MentorSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())

  const [relevantSessions, setRelevantSessions] = useState<GroupSession[]>([])
  const [discoveryLoading, setDiscoveryLoading] = useState(true)

  const careerInterests = user?.student?.careerInterests ?? []

  useEffect(() => {
    if (dashboard?.groupSessions) {
      setEnrolledIds(new Set(dashboard.groupSessions.map((e: { groupSession: { id: string } }) => e.groupSession.id)))
    }
  }, [dashboard])

  const fetchDiscovery = useCallback(async () => {
    if (careerInterests.length === 0) {
      setDiscoveryLoading(false)
      return
    }
    setDiscoveryLoading(true)
    try {
      const sectors = careerInterests.join(',')

      const gsRes = await api.get(`/group-sessions?sectors=${encodeURIComponent(sectors)}&limit=3`)
      setRelevantSessions(gsRes.data.data.sessions ?? [])
    } catch {
      // fail silently — discovery sections are non-critical
    } finally {
      setDiscoveryLoading(false)
    }
  }, [careerInterests.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/students/me/mentor-slots')
      .then(({ data }) => setMentorSlots(data.data.slots ?? []))
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [])

  useEffect(() => { fetchDiscovery() }, [fetchDiscovery])

  const handleEnrol = async (sessionId: string) => {
    setEnrolling(sessionId)
    try {
      await api.post(`/group-sessions/${sessionId}/enrol`)
      setEnrolledIds(prev => new Set([...prev, sessionId]))
    } catch {
      // fail silently
    } finally {
      setEnrolling(null)
    }
  }

  const firstName = user?.student?.firstName ?? 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })

  const upcomingOneOnOne = dashboard?.upcomingSessions.length ?? 0
  const upcomingGroup = dashboard?.groupSessions.length ?? 0
  const confidenceScore = dashboard?.latestConfidence?.score ?? null

  const combinationsConsidering = user?.student?.combinationsConsidering ?? []
  const showQuizPrompt =
    combinationsConsidering.length === 0 ||
    user?.student?.confidenceLevel == null ||
    (user?.student?.confidenceLevel ?? 10) < 5

  const renderDiscoverySessions = () => {
    if (discoveryLoading) {
      return (
        <div className={GRID}>
          {['a', 'b', 'c'].map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-40" />
          ))}
        </div>
      )
    }
    if (relevantSessions.length === 0) {
      return (
        <p className="text-sm text-muted">
          No upcoming sessions for your interests yet.{' '}
          <Link to="/student/sessions" className="text-accent hover:underline">Browse all sessions →</Link>
        </p>
      )
    }
    return (
      <div className={GRID}>
        {relevantSessions.map(gs => {
          const isEnrolled = enrolledIds.has(gs.id)
          const isPending = enrolling === gs.id
          return (
            <div key={gs.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary leading-tight">{gs.title}</p>
              {gs.description && <p className="text-xs text-muted line-clamp-2">{gs.description}</p>}
              <p className="text-xs text-muted">
                {gs.professional.firstName} {gs.professional.lastName}
                {gs.professional.jobTitle && ` · ${gs.professional.jobTitle}`}
              </p>
              <p className="text-xs text-muted">{fmtDate(gs.scheduledAt)} · {fmtTime(gs.scheduledAt)}</p>
              <p className="text-xs text-muted">{gs._count.enrolments}/{gs.maxStudents} enrolled</p>
              {gs.combinations?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {gs.combinations.slice(0, 3).map(c => (
                    <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              )}
              {isEnrolled ? (
                <span className="self-start text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium mt-auto">Enrolled</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEnrol(gs.id)}
                  disabled={isPending}
                  className="mt-auto w-full bg-accent text-white text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Joining...' : 'Join for free'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderOneOnOneSessions = () => {
    if (slotsLoading) {
      return (
        <div className={GRID}>
          {['a', 'b', 'c'].map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-32" />
          ))}
        </div>
      )
    }
    if (mentorSlots.length === 0) {
      return (
        <p className="text-sm text-muted">
          No upcoming 1-on-1 sessions.{' '}
          <Link to="/student/get-mentor" className="text-accent hover:underline">Get a mentor →</Link>
        </p>
      )
    }
    return (
      <div className={GRID}>
        {mentorSlots.map(slot => {
          const pro = slot.Professional
          const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
          const date = new Date(slot.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const time = new Date(slot.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={slot.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{pro.firstName} {pro.lastName}</p>
                  <p className="text-xs text-muted truncate">{pro.jobTitle}</p>
                </div>
              </div>
              <p className="text-xs text-muted">{date} · {time} · {slot.durationMins} min</p>
              {slot.meetLink && (
                <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  Join session ↗
                </a>
              )}
              <span className="self-start text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium mt-auto">Confirmed</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {showManualLog && (
        <ManualConfidenceModal
          combinations={user?.student?.careerInterests ?? []}
          onDone={() => { setShowManualLog(false); refetchLogs() }}
          onClose={() => setShowManualLog(false)}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowManualLog(true)}
          className="text-xs px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:text-primary transition-colors"
        >
          Log confidence
        </button>
      </div>

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
              <p className="text-2xl font-bold text-primary">{dashError ? '—' : upcomingOneOnOne}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming 1-on-1 Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{dashError ? '—' : upcomingGroup}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Group Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError || confidenceScore === null ? '—' : `${confidenceScore}/10`}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Career Confidence</p>
            </div>
          </>
        )}
      </div>

      {showQuizPrompt && (
        <div className="bg-surface rounded-xl border border-accent/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-primary">
              {combinationsConsidering.length === 0
                ? "Not sure which combination to pick?"
                : "Want to double-check your combination choice?"}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Take our 10-question quiz to get personalised A-Level combination recommendations based on your
              interests and career goals.
            </p>
          </div>
          <Link
            to="/student/quiz"
            className="shrink-0 bg-accent text-white text-xs px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors font-medium whitespace-nowrap"
          >
            Take the quiz →
          </Link>
        </div>
      )}

      {careerInterests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">Upcoming sessions for your combinations</h2>
            <Link to="/student/sessions" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {renderDiscoverySessions()}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-primary">Upcoming 1-on-1 sessions</h2>
        {renderOneOnOneSessions()}
      </section>

      {byCombo.length > 0 && <CombinationConfidenceChart trends={byCombo} />}
    </div>
  )
}

export default StudentHome
