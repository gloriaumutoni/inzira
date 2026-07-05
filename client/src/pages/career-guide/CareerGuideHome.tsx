import { Fragment, useState, useMemo } from 'react'
import { X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useCareerGuideDashboard from '@/hooks/useCareerGuideDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import useCareerGuideStudents from '@/hooks/useCareerGuideStudents'
import type { SchoolStudent } from '@/hooks/useCareerGuideStudents'
import useCareerGuideStudentDetail from '@/hooks/useCareerGuideStudentDetail'
import type { StudentDetail } from '@/hooks/useCareerGuideStudentDetail'
import CombinationConfidenceChart from '@/components/student/CombinationConfidenceChart'

const CHART_COLORS = { completed: '#16A34A', remaining: '#E2E8F0' }

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtRelative = (iso: string | null): string => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

type Status = 'needs-followup' | 'active' | 'new' | 'inactive'

const getStatus = (s: SchoolStudent): Status => {
  const now = Date.now()
  const registeredDays = (now - new Date(s.joinedAt).getTime()) / 86400000
  const lastSessionDays = s.lastSessionDate
    ? (now - new Date(s.lastSessionDate).getTime()) / 86400000
    : Infinity
  if (s.needsAttention) return 'needs-followup'
  if (lastSessionDays <= 14) return 'active'
  if (registeredDays < 7 && s.totalSessions === 0) return 'new'
  return 'inactive'
}

const STATUS_ORDER: Record<Status, number> = {
  'needs-followup': 0,
  'new': 1,
  'active': 2,
  'inactive': 3,
}

const StatusBadge = ({ status }: { status: Status }) => {
  const cfg = {
    'needs-followup': { label: 'Needs Follow-up', cls: 'bg-error/10 text-error' },
    active: { label: 'Active', cls: 'bg-success/10 text-success' },
    new: { label: 'New', cls: 'bg-accent/10 text-accent' },
    inactive: { label: 'Inactive', cls: 'bg-muted/10 text-muted' },
  }[status]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

const DeltaBadge = ({ delta }: { delta: number | null }) => {
  if (delta === null) return <span className="text-muted text-xs">—</span>
  if (delta > 0) return <span className="text-success text-xs font-semibold">+{delta}</span>
  if (delta < 0) return <span className="text-error text-xs font-semibold">{delta}</span>
  return <span className="text-muted text-xs">±0</span>
}

// ─── Expandable activity row ─────────────────────────────────────────────────

const describeLastActivity = (
  sessionHistory: StudentDetail['sessionHistory'],
  confidenceLogs: StudentDetail['confidenceLogs'],
): string => {
  const lastSession = sessionHistory[0]
  const lastLog = confidenceLogs[confidenceLogs.length - 1]

  const lastSessionTime = lastSession ? new Date(lastSession.date).getTime() : -Infinity
  const lastLogTime = lastLog ? new Date(lastLog.createdAt).getTime() : -Infinity

  if (!lastSession && !lastLog) return 'No activity yet'

  if (lastSessionTime >= lastLogTime) {
    const who = lastSession.type === 'Group' ? lastSession.title ?? 'a group session' : lastSession.professionalName
    const verb = lastSession.status === 'COMPLETED' ? 'Completed' : lastSession.status === 'UPCOMING' ? 'Booked' : 'Attended'
    return `${verb} ${lastSession.type === 'Group' ? '' : 'session with '}${who} · ${fmtDate(lastSession.date)}`
  }

  return `Logged confidence ${lastLog.score}/10 for ${lastLog.combination ?? 'general'} · ${fmtDate(lastLog.createdAt)}`
}

const ExpandedActivityRow = ({ student }: { student: SchoolStudent }) => {
  const { detail, loading } = useCareerGuideStudentDetail(student.id)
  const reflections = detail?.confidenceLogs.filter((l) => l.sessionId !== null) ?? []
  const reflectionTrend =
    reflections.length >= 2 ? reflections[reflections.length - 1].score - reflections[0].score : null

  return (
    <tr className="bg-background/40">
      <td colSpan={9} className="px-5 py-4">
        {loading || !detail ? (
          <div className="h-16 bg-border/40 animate-pulse rounded-lg" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Last Activity</p>
              <p className="text-xs text-primary">
                {describeLastActivity(detail.sessionHistory, detail.confidenceLogs)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Reflections</p>
              <p className="text-xs text-primary">
                {reflections.length === 0
                  ? 'None submitted yet'
                  : `${reflections.length} submitted${
                      reflectionTrend === null
                        ? ''
                        : reflectionTrend > 0
                        ? ', confidence trending up'
                        : reflectionTrend < 0
                        ? ', confidence trending down'
                        : ', confidence steady'
                    }`}
              </p>
              {reflections.length > 0 && reflections[reflections.length - 1].note && (
                <p className="text-xs text-muted italic mt-0.5">
                  "{reflections[reflections.length - 1].note}"
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Combinations Considering</p>
              {detail.combinationsConsidering.length === 0 ? (
                <p className="text-xs text-muted">None set</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {detail.combinationsConsidering.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Session History ({detail.sessionHistory.length})
              </p>
              {detail.sessionHistory.length === 0 ? (
                <p className="text-xs text-muted">No sessions yet</p>
              ) : (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {detail.sessionHistory.map((sess, i) => (
                    <div key={`${sess.id}-${i}`} className="flex justify-between gap-2 text-xs">
                      <span className="text-primary truncate">
                        {sess.type === 'Group' ? sess.title ?? 'Group Session' : sess.professionalName}
                      </span>
                      <span className="text-muted whitespace-nowrap">{fmtDate(sess.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.confidenceTrends.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Confidence Trend</p>
                <CombinationConfidenceChart trends={detail.confidenceTrends} />
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Engagement table ────────────────────────────────────────────────────────

type SortKey = 'name' | 'sessions' | 'confidence' | 'lastActive' | 'status'

const EngagementTable = ({ students }: { students: SchoolStudent[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      switch (sortKey) {
        case 'name':
          return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        case 'sessions':
          return dir * (a.totalSessions - b.totalSessions)
        case 'confidence':
          return dir * ((a.currentConfidence ?? 0) - (b.currentConfidence ?? 0))
        case 'lastActive':
          return (
            dir *
            ((a.lastActiveDate ? new Date(a.lastActiveDate).getTime() : 0) -
              (b.lastActiveDate ? new Date(b.lastActiveDate).getTime() : 0))
          )
        case 'status':
          return dir * (STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)])
        default:
          return 0
      }
    })
  }, [students, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((p) => !p)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />
    ) : null

  return (
    <>
      {/* table */}
      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th
                className="text-left px-4 py-3 text-muted font-semibold uppercase tracking-wide cursor-pointer select-none"
                onClick={() => toggleSort('name')}
              >
                Name <SortIcon k="name" />
              </th>
              <th className="text-left px-3 py-3 text-muted font-semibold uppercase tracking-wide">Level</th>
              <th className="text-left px-3 py-3 text-muted font-semibold uppercase tracking-wide">Year</th>
              <th className="text-left px-3 py-3 text-muted font-semibold uppercase tracking-wide">Combinations</th>
              <th
                className="text-center px-3 py-3 text-muted font-semibold uppercase tracking-wide cursor-pointer select-none"
                onClick={() => toggleSort('sessions')}
              >
                Sessions <SortIcon k="sessions" />
              </th>
              <th
                className="text-center px-3 py-3 text-muted font-semibold uppercase tracking-wide cursor-pointer select-none"
                onClick={() => toggleSort('confidence')}
              >
                Confidence <SortIcon k="confidence" />
              </th>
              <th
                className="text-left px-3 py-3 text-muted font-semibold uppercase tracking-wide cursor-pointer select-none"
                onClick={() => toggleSort('lastActive')}
              >
                Last Active <SortIcon k="lastActive" />
              </th>
              <th
                className="text-left px-3 py-3 text-muted font-semibold uppercase tracking-wide cursor-pointer select-none"
                onClick={() => toggleSort('status')}
              >
                Status <SortIcon k="status" />
              </th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const status = getStatus(s)
              const isExpanded = expandedId === s.id
              return (
                <Fragment key={s.id}>
                  <tr
                    className="border-b border-border last:border-0 hover:bg-background/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-3 py-3 text-muted whitespace-nowrap">
                      {s.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
                    </td>
                    <td className="px-3 py-3 text-muted">{s.schoolYear}</td>
                    <td className="px-3 py-3 text-muted max-w-[140px]">
                      {s.combinationsConsidering.length > 0
                        ? s.combinationsConsidering.slice(0, 2).join(', ') +
                          (s.combinationsConsidering.length > 2
                            ? ` +${s.combinationsConsidering.length - 2}`
                            : '')
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-primary">{s.totalSessions}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-primary">
                        {s.currentConfidence ?? '—'}
                      </span>
                      <span className="ml-1">
                        <DeltaBadge delta={s.confidenceDelta} />
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted whitespace-nowrap">
                      {fmtRelative(s.lastActiveDate)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                  </tr>
                  {isExpanded && <ExpandedActivityRow student={s} />}
                </Fragment>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

const CareerGuideHome = () => {
  const { user, setUser } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useCareerGuideDashboard()
  const { sessions: groupSessions, loading: gsLoading } = useGroupSessions({ limit: 2 })
  const { students, loading: studentsLoading } = useCareerGuideStudents()
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resubmitting, setResubmitting] = useState(false)

  const firstName = user?.careerGuide?.firstName ?? 'Guide'
  const schoolName = dashboard?.school?.name

  if (user?.careerGuide && !user.careerGuide.isVerified) {
    const isRejected = user.careerGuide.verificationStatus === 'REJECTED'

    const handleResubmit = async () => {
      setResubmitting(true)
      try {
        await api.post('/career-guides/me/reapply', { linkedinUrl: linkedinUrl.trim() || undefined })
        toast.success('Application resubmitted.')
        setShowResubmitModal(false)
        setUser({
          ...user!,
          careerGuide: {
            ...user!.careerGuide!,
            linkedinUrl: linkedinUrl.trim() || user!.careerGuide!.linkedinUrl,
            verificationStatus: 'PENDING',
            verificationAttempts: (user!.careerGuide!.verificationAttempts ?? 0) + 1,
          },
        })
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        toast.error(msg ?? 'Could not resubmit. Please try again.')
      } finally {
        setResubmitting(false)
      }
    }

    const verificationAttempts = user.careerGuide.verificationAttempts ?? 0

    return (
      <div className="p-6 space-y-6">
        {showResubmitModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <dialog open aria-labelledby="cg-resubmit-title" className="static bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 m-0 border-0">
              <div className="flex items-center justify-between mb-4">
                <h2 id="cg-resubmit-title" className="text-base font-bold text-primary">Resubmit Application</h2>
                <button onClick={() => setShowResubmitModal(false)} className="text-muted hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted mb-5">Update your LinkedIn profile URL and resubmit for admin review.</p>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wide">LinkedIn URL</label>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder={user.careerGuide?.linkedinUrl ?? 'https://linkedin.com/in/your-profile'}
                  className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-background text-primary"
                />
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
                  disabled={resubmitting}
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
              {user.careerGuide.rejectionReason && (
                <p className="text-xs text-muted mt-1">{user.careerGuide.rejectionReason}</p>
              )}
              <button
                onClick={() => { setLinkedinUrl(user.careerGuide?.linkedinUrl ?? ''); setShowResubmitModal(true) }}
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
        <div className="grid grid-cols-3 gap-4 opacity-40 pointer-events-none">
          {['STUDENTS REGISTERED', 'SESSIONS COMPLETED', 'AVG CONFIDENCE'].map((label) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-border">—</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const oLevelCount = dashError ? null : ((dashboard?.totalStudents ?? 0) - (dashboard?.aLevelCount ?? 0))
  const aLevelCount = dashError ? null : (dashboard?.aLevelCount ?? 0)

  const totalMentorBooked = students.reduce((acc, s) => acc + s.mentorEnrolled, 0)
  const totalGroupEnrolled = students.reduce((acc, s) => acc + s.groupEnrolled, 0)
  const totalGroupCompleted = students.reduce((acc, s) => acc + s.groupCompleted, 0)
  const totalMentorCompleted = students.reduce((acc, s) => acc + s.mentorCompleted, 0)
  const totalCompleted = totalGroupCompleted + totalMentorCompleted
  const totalAll = totalMentorBooked + totalGroupEnrolled
  const completionRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0

  const chartData = totalAll > 0
    ? [{ value: totalCompleted }, { value: totalAll - totalCompleted }]
    : [{ value: 1 }]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
          {schoolName && (
            <p className="text-sm text-muted mt-0.5">Career Discovery · {schoolName}</p>
          )}
        </div>
      </div>

      {/* Student level stats */}
      <div className="grid grid-cols-2 gap-4">
        {dashLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{oLevelCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">O-Level Students</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{aLevelCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">A-Level Students</p>
            </div>
          </>
        )}
      </div>

      {/* Session activity donut */}
      {!studentsLoading && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-primary mb-4">Session Activity</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={52}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {totalAll > 0 ? (
                      <>
                        <Cell fill={CHART_COLORS.completed} />
                        <Cell fill={CHART_COLORS.remaining} />
                      </>
                    ) : (
                      <Cell fill={CHART_COLORS.remaining} />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-primary">{completionRate}%</p>
                <p className="text-xs text-muted leading-tight">done</p>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted">Mentor Bookings</span>
                <span className="text-xs font-semibold text-primary">{totalMentorBooked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Group Enrollments</span>
                <span className="text-xs font-semibold text-primary">{totalGroupEnrolled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Group Completed</span>
                <span className="text-xs font-semibold text-success">{totalGroupCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Mentor Completed</span>
                <span className="text-xs font-semibold text-success">{totalMentorCompleted}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming group sessions */}
      <div>
        <h2 className="text-base font-semibold text-primary mb-4">Upcoming group sessions</h2>
        {gsLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-border rounded-xl h-20" />
            <div className="animate-pulse bg-border rounded-xl h-20" />
          </div>
        ) : groupSessions.length === 0 ? (
          <p className="text-sm text-muted">No upcoming group sessions.</p>
        ) : (
          <div className="space-y-3">
            {groupSessions.map((gs) => (
              <div key={gs.id} className="bg-surface rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-accent">
                  {new Date(gs.scheduledAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm font-semibold text-primary mt-0.5">{gs.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student engagement table */}
      <div>
        <h2 className="text-base font-semibold text-primary mb-4">Student Engagement</h2>
        {studentsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-12" />
            ))}
          </div>
        ) : (
          <EngagementTable students={students} />
        )}
      </div>
    </div>
  )
}

export default CareerGuideHome
