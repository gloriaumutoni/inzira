import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useCareerGuideImpact } from '@/hooks/queries/careerGuideQueries'

const FUNNEL_STEPS = (impact: { signups: number; quizCompletions: number; streamChosenCount: number }) => [
  { label: 'Signups', value: impact.signups },
  { label: 'Quiz completed', value: impact.quizCompletions },
  { label: 'Stream chosen', value: impact.streamChosenCount },
]

const CohortImpact = () => {
  const { data: impact, isLoading } = useCareerGuideImpact()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Cohort Impact</h1>
        <p className="text-sm text-muted mt-0.5">How your students are moving from signup to a confident pathway choice.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-primary mb-4">Funnel</h2>
        {isLoading || !impact ? (
          <div className="animate-pulse bg-border rounded-lg h-24" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FUNNEL_STEPS(impact).map((step, i) => {
              const prev = i === 0 ? impact.signups : FUNNEL_STEPS(impact)[i - 1].value
              const pct = prev > 0 ? Math.round((step.value / prev) * 100) : 0
              return (
                <div key={step.label} className="text-center">
                  <p className="text-2xl font-bold text-primary">{step.value}</p>
                  <p className="text-xs text-muted uppercase tracking-wide mt-1">{step.label}</p>
                  {i > 0 && <p className="text-xs text-muted mt-1">{pct}% of previous step</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-primary mb-4">Confidence Change</h2>
        {isLoading || !impact ? (
          <div className="animate-pulse bg-border rounded-lg h-20" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{impact.avgConfidenceStart.toFixed(1)}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Avg Start</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{impact.avgConfidenceLatest.toFixed(1)}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Avg Latest</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {impact.deltaConfidence > 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : impact.deltaConfidence < 0 ? (
                  <TrendingDown className="w-5 h-5 text-error" />
                ) : (
                  <Minus className="w-5 h-5 text-muted" />
                )}
                <p
                  className={`text-2xl font-bold ${
                    impact.deltaConfidence > 0 ? 'text-success' : impact.deltaConfidence < 0 ? 'text-error' : 'text-primary'
                  }`}
                >
                  {impact.deltaConfidence > 0 ? '+' : ''}
                  {impact.deltaConfidence.toFixed(1)}
                </p>
              </div>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Delta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CohortImpact
