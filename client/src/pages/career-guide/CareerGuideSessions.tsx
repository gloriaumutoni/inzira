import useCareerGuideDashboard from '@/hooks/useCareerGuideDashboard'
import useCareerGuideStudents, { type SchoolStudent } from '@/hooks/useCareerGuideStudents'

function confidenceDelta(initial: number | null, current: number | null): {
  text: string
  className: string
} {
  if (current == null) return { text: '—', className: 'text-muted' }
  if (initial == null) return { text: String(current), className: 'text-primary' }
  const delta = current - initial
  if (delta > 0) return { text: `${initial} → ${current} ↑`, className: 'text-success' }
  if (delta < 0) return { text: `${initial} → ${current} ↓`, className: 'text-error' }
  return { text: `${current}`, className: 'text-muted' }
}

function formatProfessionals(list: SchoolStudent['professionals']): string {
  if (list.length === 0) return '—'
  const shown = list.slice(0, 2).map((p) => p.name).join(', ')
  return list.length > 2 ? `${shown} +${list.length - 2}` : shown
}

function professionalsTitleAttr(list: SchoolStudent['professionals']): string {
  return list.map((p) => `${p.name} (${p.sector})`).join('\n')
}

function BreakdownCell({
  total,
  group,
  mentor,
  align = 'right',
}: Readonly<{
  total: number
  group: number
  mentor: number
  align?: 'left' | 'right'
}>) {
  return (
    <div className={`relative group inline-block cursor-help ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className="underline decoration-dashed decoration-muted/60 text-muted">{total}</span>
      <div className={`hidden group-hover:block absolute bottom-full z-20 mb-2 bg-surface border border-border rounded-lg shadow-card p-3 min-w-[140px] ${align === 'right' ? 'right-0' : 'left-0'}`}>
        <div className="text-xs space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted whitespace-nowrap">Group</span>
            <span className="font-semibold text-primary">{group}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted whitespace-nowrap">Mentor</span>
            <span className="font-semibold text-primary">{mentor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const CareerGuideSessions = () => {
  const { dashboard, loading: dashLoading, error: dashError } = useCareerGuideDashboard()
  const { students, loading: studentsLoading, error: studentsError } = useCareerGuideStudents()

  const oLevelCount = dashError ? null : ((dashboard?.totalStudents ?? 0) - (dashboard?.aLevelCount ?? 0))
  const aLevelCount = dashError ? null : (dashboard?.aLevelCount ?? 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Students</h1>
        <p className="text-sm text-muted mt-1">Individual activity and confidence progress for your school.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Student table */}
      {studentsLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-12" />
          ))}
        </div>
      ) : studentsError ? (
        <p className="text-sm text-muted">Unable to load student data.</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted">No students registered at your school yet.</p>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Combination</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Enrolled</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Completed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Confidence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Professionals</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const delta = confidenceDelta(s.initialConfidence, s.confidenceLevel)
                return (
                  <tr key={s.id} className={i < students.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-4 py-3 font-medium text-primary">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-muted">{s.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}</td>
                    <td className="px-4 py-3 text-muted">{s.combination ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <BreakdownCell
                        total={s.groupEnrolled + s.mentorEnrolled}
                        group={s.groupEnrolled}
                        mentor={s.mentorEnrolled}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BreakdownCell
                        total={s.groupCompleted + s.mentorCompleted}
                        group={s.groupCompleted}
                        mentor={s.mentorCompleted}
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${delta.className}`}>{delta.text}</td>
                    <td
                      className="px-4 py-3 text-xs text-muted max-w-[180px] truncate"
                      title={professionalsTitleAttr(s.professionals)}
                    >
                      {formatProfessionals(s.professionals)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CareerGuideSessions
