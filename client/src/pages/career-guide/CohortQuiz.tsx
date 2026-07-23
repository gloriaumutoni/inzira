import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import useCareerGuideStudents from '@/hooks/useCareerGuideStudents'
import { useCohortQuizSummary } from '@/hooks/queries/careerGuideQueries'
import { STREAM_MAP, isStreamCode, type StreamCode } from '@/constants/streams'

const BAR_COLORS: Record<StreamCode, string> = {
  MATH_SCIENCES: '#2563EB',
  ARTS_HUMANITIES: '#D97706',
  LANGUAGES: '#16A34A',
}

const CohortQuiz = () => {
  const { students, loading: studentsLoading } = useCareerGuideStudents()
  const { data: summary, isLoading: summaryLoading } = useCohortQuizSummary()

  const chartData = summary
    ? (Object.keys(summary.streamDistribution) as StreamCode[]).map((code) => ({
        code,
        name: STREAM_MAP[code]?.name ?? code,
        count: summary.streamDistribution[code],
      }))
    : []

  const notStarted = students.filter((s) => !s.quizTaken)
  const done = students.filter((s) => s.quizTaken)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Cohort Quiz</h1>
        <p className="text-sm text-muted mt-0.5">
          Track quiz completion and stream leanings across your students. Students answer for themselves — this view is read-only.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{summaryLoading ? '—' : summary?.totalStudents ?? 0}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Total Students</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{summaryLoading ? '—' : summary?.quizzedCount ?? 0}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Quiz Completed</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {summaryLoading || !summary || summary.totalStudents === 0
              ? '—'
              : `${Math.round((summary.quizzedCount / summary.totalStudents) * 100)}%`}
          </p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Completion Rate</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-primary mb-4">Stream Distribution</h2>
        {summaryLoading ? (
          <div className="animate-pulse bg-border rounded-lg h-48" />
        ) : chartData.every((d) => d.count === 0) ? (
          <p className="text-sm text-muted">No quiz results yet — distribution will appear once students complete the quiz.</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.code} fill={BAR_COLORS[d.code]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-5 pb-0">
          <h2 className="text-base font-semibold text-primary">Roster</h2>
        </div>
        {studentsLoading ? (
          <div className="p-5 space-y-2">
            <div className="animate-pulse bg-border rounded h-10" />
            <div className="animate-pulse bg-border rounded h-10" />
          </div>
        ) : students.length === 0 ? (
          <p className="p-5 text-sm text-muted">No students registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-4 min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-t border-border">
                  <th className="px-5 py-2 font-medium">Student</th>
                  <th className="px-5 py-2 font-medium">Level</th>
                  <th className="px-5 py-2 font-medium">Stream</th>
                  <th className="px-5 py-2 font-medium">Quiz status</th>
                </tr>
              </thead>
              <tbody>
                {[...done, ...notStarted].map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-5 py-3 text-primary whitespace-nowrap">{s.firstName} {s.lastName}</td>
                    <td className="px-5 py-3 text-muted whitespace-nowrap">{s.level === 'A_LEVEL' ? 'A-Level' : 'O-Level'}</td>
                    <td className="px-5 py-3 text-muted whitespace-nowrap">
                      {s.streamCode && isStreamCode(s.streamCode) ? STREAM_MAP[s.streamCode].name : s.streamCode ?? '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {s.quizTaken ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Done</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">Not started</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CohortQuiz
