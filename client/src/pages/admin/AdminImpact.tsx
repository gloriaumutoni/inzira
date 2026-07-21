import { useState } from 'react'
import { TrendingUp, Users, ClipboardList, MapPin, BookOpen } from 'lucide-react'
import { useAdminImpactQuery } from '@/hooks/queries/adminQueries'

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'O_LEVEL', label: 'O-Level' },
  { value: 'A_LEVEL', label: 'A-Level' },
]

function FunnelBar({ label, value, max, icon: Icon, color }: {
  label: string
  value: number
  max: number
  icon: React.ElementType
  color: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          <Icon size={13} className={color} />
          {label}
        </span>
        <span className="font-semibold text-primary">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted">{pct}% of signups</p>
    </div>
  )
}

export default function AdminImpact() {
  const [schoolId, setSchoolId] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const { data, isLoading, isError } = useAdminImpactQuery(schoolId, level || undefined)

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-border rounded-xl h-20" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-error text-sm">Failed to load impact data.</p>
      </div>
    )
  }

  const { funnel, confidence, bySchool } = data
  const maxFunnel = funnel.signups

  const confDeltaColour =
    confidence.delta > 0 ? 'text-success' : confidence.delta < 0 ? 'text-error' : 'text-muted'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">Impact Overview</h1>
          <p className="text-sm text-muted mt-0.5">Signup → quiz → pathway → session funnel + confidence delta.</p>
        </div>
        {/* Filters */}
        <div className="flex gap-2">
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-primary"
            value={level ?? ''}
            onChange={(e) => setLevel(e.target.value || undefined)}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Funnel */}
      <section className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-primary">Funnel</h2>
        <FunnelBar
          label="Signups"
          value={funnel.signups}
          max={maxFunnel}
          icon={Users}
          color="text-accent"
        />
        <FunnelBar
          label="Quiz completions"
          value={funnel.quizCompletions}
          max={maxFunnel}
          icon={ClipboardList}
          color="text-primary"
        />
        <FunnelBar
          label="Stream chosen"
          value={funnel.streamChosen}
          max={maxFunnel}
          icon={MapPin}
          color="text-warning"
        />
        <FunnelBar
          label="Mentor sessions booked"
          value={funnel.mentorSessionsBooked}
          max={maxFunnel}
          icon={BookOpen}
          color="text-success"
        />
      </section>

      {/* Confidence delta */}
      <section className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">Confidence Delta</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg start', value: confidence.avgStart, colour: 'text-muted' },
            { label: 'Avg latest', value: confidence.avgLatest, colour: 'text-primary' },
            {
              label: 'Delta',
              value: confidence.delta,
              colour: confDeltaColour,
              prefix: confidence.delta > 0 ? '+' : '',
            },
          ].map(({ label, value, colour, prefix }) => (
            <div key={label} className="text-center">
              <p className={`text-3xl font-bold ${colour}`}>
                {prefix}{value.toFixed(1)}
              </p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3 text-center">
          Confidence scores are 1–10. Delta = latest avg minus start avg across all students with ≥ 2 logs.
        </p>
      </section>

      {/* Per-school breakdown */}
      {bySchool.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-primary mb-3">By School</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">School</th>
                  <th className="text-left px-4 py-3 font-medium">Signups</th>
                  <th className="text-left px-4 py-3 font-medium">Quiz Completions</th>
                  <th className="text-left px-4 py-3 font-medium">Conf. Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bySchool
                  .slice()
                  .sort((a, b) => b.signups - a.signups)
                  .map((s) => {
                    const deltaColour =
                      s.avgDelta > 0 ? 'text-success' : s.avgDelta < 0 ? 'text-error' : 'text-muted'
                    return (
                      <tr key={s.schoolId} className="hover:bg-background transition">
                        <td className="px-4 py-3 font-medium text-primary">
                          <button
                            className="hover:underline"
                            onClick={() => setSchoolId(schoolId === s.schoolId ? undefined : s.schoolId)}
                          >
                            {s.schoolName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted">{s.signups}</td>
                        <td className="px-4 py-3 text-muted">
                          {s.quizCompletions}
                          {s.signups > 0 && (
                            <span className="ml-1 text-xs text-muted">
                              ({Math.round((s.quizCompletions / s.signups) * 100)}%)
                            </span>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${deltaColour}`}>
                          {s.avgDelta > 0 ? '+' : ''}{s.avgDelta.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {schoolId && (
            <p className="text-xs text-accent mt-2 cursor-pointer hover:underline" onClick={() => setSchoolId(undefined)}>
              ✕ Clear school filter
            </p>
          )}
        </section>
      )}

      {bySchool.length === 0 && (
        <div className="text-center py-10 text-muted text-sm">No school data available yet.</div>
      )}
    </div>
  )
}
