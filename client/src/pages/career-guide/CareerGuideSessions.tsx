import { RefreshCw } from 'lucide-react'
import useCareerGuideDashboard from '@/hooks/useCareerGuideDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import useCareers from '@/hooks/useCareers'
import { getSectorStyle } from '@/utils/sectorColors'

function confidenceLabel(score: number): { text: string; className: string } {
  if (score >= 71) return { text: 'High', className: 'text-success' }
  if (score >= 41) return { text: 'Medium', className: 'text-warning' }
  if (score > 0) return { text: 'Low', className: 'text-error' }
  return { text: '—', className: 'text-muted' }
}

function getWeekDays(): { label: string; date: Date }[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return { label, date }
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const CareerGuideSessions = () => {
  const { dashboard, loading: dashLoading } = useCareerGuideDashboard()
  // TODO: endpoint missing or access denied — GET /sessions is not accessible to CAREER_GUIDE role
  const { sessions: groupSessions, loading: gsLoading } = useGroupSessions()
  const { careers, loading: careersLoading } = useCareers({ limit: 6 })

  const confidence = confidenceLabel(dashboard?.avgConfidence ?? 0)
  const weekDays = getWeekDays()

  const sessionDaysInWeek = groupSessions
    .map((gs) => new Date(gs.scheduledAt))
    .filter((d) => weekDays.some((wd) => isSameDay(wd.date, d)))

  const sessionCountByDay = weekDays.map((wd) => ({
    ...wd,
    count: sessionDaysInWeek.filter((d) => isSameDay(wd.date, d)).length,
  }))

  const totalActivity =
    (dashboard?.totalSessions ?? 0) +
    (dashboard?.totalWorkshops ?? 0) +
    groupSessions.length

  const typeBreakdown = [
    {
      label: 'Individual Sessions',
      count: dashboard?.totalSessions ?? 0,
      badgeClass: 'bg-accent/10 text-accent',
    },
    {
      label: 'Workshops',
      count: dashboard?.totalWorkshops ?? 0,
      badgeClass: 'bg-warning/10 text-warning',
    },
    {
      label: 'Group Sessions',
      count: groupSessions.length,
      badgeClass: 'bg-success/10 text-success',
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Career Discovery</h1>
          <p className="text-sm text-muted mt-1">Overview of your school's career exploration activity.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <RefreshCw size={14} />
          Get all latest stats →
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {dashLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-24" />
            ))}
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{dashboard?.totalStudents ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Students Registered</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{dashboard?.totalSessions ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Sessions Completed</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashboard?.aLevelCount ? dashboard.aLevelCount : '—'}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">A-Level Students</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${confidence.className}`}>{confidence.text}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Avg Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Summary table */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Summary</h2>
          <div className="space-y-3 mt-4">
            {[
              { key: 'Total Students', value: dashboard?.totalStudents },
              { key: 'Sessions Booked', value: dashboard?.totalSessions },
              { key: 'Workshops Attended', value: dashboard?.totalWorkshops },
              { key: 'Group Sessions', value: groupSessions.length },
              { key: 'Avg Confidence', value: null },
            ].map((row) => (
              <div
                key={row.key}
                className="flex justify-between items-center border-b border-border pb-2"
              >
                <span className="text-xs text-muted">{row.key}</span>
                {row.key === 'Avg Confidence' ? (
                  <span className={`text-sm font-semibold ${confidence.className}`}>
                    {dashLoading ? '—' : confidence.text}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-primary">
                    {dashLoading ? '—' : (row.value ?? '—')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sessions by type */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Sessions by type</h2>
          <div className="space-y-4 mt-4">
            {typeBreakdown.map((t) => {
              const pct = totalActivity > 0 ? (t.count / totalActivity) * 100 : 0
              return (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badgeClass}`}>
                      {t.label}
                    </span>
                    <span className="text-xs text-muted">{t.count}</span>
                  </div>
                  <div className="bg-border rounded-full h-1">
                    <div
                      className="bg-accent rounded-full h-1"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly activity */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Weekly activity</h2>
          {gsLoading ? (
            <div className="animate-pulse bg-border rounded h-20 mt-4" />
          ) : (
            <div className="grid grid-cols-7 gap-1 mt-4">
              {sessionCountByDay.map(({ label, date, count }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-xs text-muted text-center">{label}</span>
                  <span className="text-xs font-semibold text-primary text-center">{date.getDate()}</span>
                  {count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-accent mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Browse careers */}
      <div className="bg-surface rounded-xl border border-border p-5 mt-6">
        <h2 className="text-base font-semibold text-primary">Browse careers your students are exploring</h2>
        {careersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-28" />
            ))}
          </div>
        ) : careers.length === 0 ? (
          <p className="text-sm text-muted mt-4">No careers available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {careers.map((c) => (
              <div
                key={c.id}
                className="rounded-xl p-4 text-white"
                style={{ backgroundColor: getSectorStyle(c.sector).bg }}
              >
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ backgroundColor: getSectorStyle(c.sector).badge }}
                >
                  {c.sector}
                </span>
                <p className="text-sm font-bold text-white mt-2">{c.title}</p>
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly session calendar */}
      <div className="bg-surface rounded-xl border border-border p-5 mt-6">
        <h2 className="text-base font-semibold text-primary">Weekly Session Calendar</h2>
        <div className="grid grid-cols-7 gap-2 mt-4">
          {sessionCountByDay.map(({ label, date, count }) =>
            count > 0 ? (
              <div key={label} className="bg-accent/10 rounded-lg p-2 text-center">
                <p className="text-xs text-muted">{label}</p>
                <p className="text-xs font-semibold text-primary">{date.getDate()}</p>
                <div className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mx-auto mt-1">
                  {count}
                </div>
              </div>
            ) : (
              <div key={label} className="text-xs text-muted text-center p-2">
                <p>{label}</p>
                <p className="font-semibold text-primary">{date.getDate()}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export default CareerGuideSessions
