import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useConfidenceLogs from '@/hooks/useConfidenceLogs'
import ManualConfidenceModal from '@/components/student/ManualConfidenceModal'
import CombinationConfidenceChart from '@/components/student/CombinationConfidenceChart'
import {
  useMentorSlotsQuery,
  useGroupSessionsBrowseQuery,
  useCareerStoriesDiscoveryQuery,
  useEnrolGroupSessionMutation,
  useReachableCareers,
} from '@/hooks/queries/studentQueries'
import { Compass, Users as UsersIcon, ArrowRight } from 'lucide-react'
import { getTrackLabel } from '@/utils/studentTrack'

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

const ALevelHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { byCombo, refetch: refetchLogs } = useConfidenceLogs()
  const [showManualLog, setShowManualLog] = useState(false)

  const studentCombos = user?.student?.combinationsConsidering ?? []

  const { data: mentorSlots = [], isLoading: slotsLoading } = useMentorSlotsQuery()
  const { data: relevantSessions = [], isLoading: sessionsDiscoveryLoading } = useGroupSessionsBrowseQuery(
    { combination: studentCombos.join(','), limit: 3 },
    studentCombos.length > 0
  )
  const { data: relevantStories = [], isLoading: storiesDiscoveryLoading } = useCareerStoriesDiscoveryQuery(studentCombos)
  const { data: reachData } = useReachableCareers()
  const reachDirect = (reachData?.reachable ?? []).slice(0, 3)
  const reachStretch = (reachData?.stretch ?? []).slice(0, 3)
  const reachTop = [...reachDirect, ...reachStretch]

  const enrolledIds = useMemo(
    () => new Set((dashboard?.groupSessions ?? []).map(e => e.groupSession.id)),
    [dashboard]
  )

  const enrolMutation = useEnrolGroupSessionMutation()
  const handleEnrol = (sessionId: string) => enrolMutation.mutate(sessionId)

  const firstName = user?.student?.firstName ?? 'there'
  const combination = getTrackLabel(user?.student) ?? 'A-Level'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })

  const upcomingGroup = dashboard?.groupSessions.length ?? 0
  const upcomingMentor = mentorSlots.length
  const confidenceScore = dashboard?.latestConfidence?.score ?? null

  const renderDiscoverySessions = () => {
    if (sessionsDiscoveryLoading) {
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
          No upcoming sessions for your combinations yet.{' '}
          <Link to="/student/sessions" className="text-accent hover:underline">Browse all sessions →</Link>
        </p>
      )
    }
    return (
      <div className={GRID}>
        {relevantSessions.map(gs => {
          const isEnrolled = enrolledIds.has(gs.id)
          const isPending = enrolMutation.isPending && enrolMutation.variables === gs.id
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
          streamCode={user?.student?.streamCode}
          onDone={() => { setShowManualLog(false); refetchLogs() }}
          onClose={() => setShowManualLog(false)}
        />
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
            <p className="text-sm text-muted mt-0.5">{today}</p>
          </div>
          <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full mt-1">
            {combination}
          </span>
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
              <p className="text-2xl font-bold text-primary">{dashError ? '—' : upcomingGroup}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Group Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{slotsLoading ? '—' : upcomingMentor}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Mentor Sessions</p>
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

      {reachTop.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary flex items-center gap-2">
              <Compass className="w-4 h-4" /> Careers you can reach
            </h2>
            <Link to="/student/reach" className="text-xs text-accent hover:underline">Explore all →</Link>
          </div>
          <div className={GRID}>
            {reachTop.map(c => (
              <Link
                key={c.id}
                to={`/student/career-roadmap/${c.id}`}
                className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-primary leading-tight">{c.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${
                    c.reachability === 'DIRECT' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {c.reachability === 'DIRECT' ? 'Direct' : 'Stretch'}
                  </span>
                </div>
                <span className="self-start text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">{c.sector}</span>
                <p className="text-xs text-muted line-clamp-2">{c.shortDescription}</p>
                <div className="flex items-center gap-3 text-xs text-muted mt-auto pt-1">
                  <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {c.mentorCount}</span>
                  <span>See roadmap</span>
                  <ArrowRight className="w-3.5 h-3.5 text-accent ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {studentCombos.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">Upcoming sessions for your combinations</h2>
            <Link to="/student/sessions" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {renderDiscoverySessions()}
        </section>
      )}

      {studentCombos.length > 0 && !storiesDiscoveryLoading && relevantStories.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">Career stories from professionals in your field</h2>
            <Link to="/student/career-library" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          <div className={GRID}>
            {relevantStories.map(story => (
              <div key={story.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary leading-tight">{story.jobTitle}</p>
                <p className="text-xs text-muted">{story.professional.firstName} {story.professional.lastName} · {story.professional.employer}</p>
                <span className="self-start text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{story.sector}</span>
                {story.combinations?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {story.combinations.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted line-clamp-3 mt-1">{story.myPath}</p>
                <Link to={`/student/career-library?story=${story.id}`} className="text-xs text-accent hover:underline mt-auto">Read more →</Link>
              </div>
            ))}
          </div>
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

export default ALevelHome
