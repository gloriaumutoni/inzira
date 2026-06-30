import { Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useCareerGuideDashboard from '@/hooks/useCareerGuideDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import { getSectorStyle } from '@/utils/sectorColors'

function confidenceLabel(score: number): { text: string; className: string } {
  if (score >= 71) return { text: 'High', className: 'text-success' }
  if (score >= 41) return { text: 'Medium', className: 'text-warning' }
  if (score > 0) return { text: 'Low', className: 'text-error' }
  return { text: '—', className: 'text-muted' }
}

const FALLBACK_SECTORS = ['Technology', 'Healthcare', 'Education', 'Agriculture']

const CareerGuideHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useCareerGuideDashboard()
  const { sessions: groupSessions, loading: gsLoading } = useGroupSessions(2)

  const firstName = user?.careerGuide?.firstName ?? 'Guide'
  const schoolName = dashboard?.school?.name

  if (user?.careerGuide?.isVerified === false) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-10 max-w-lg text-center shadow-sm">
          <Clock className="text-warning w-12 h-12 mx-auto" />
          <h2 className="text-xl font-bold text-primary mt-4">
            Your account is under review
          </h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Our team is verifying your role using the LinkedIn profile you provided. This usually takes 1–2 business days. You’ll receive an email at {user?.email} once your account is approved.
          </p>
          <p className="text-xs text-subtle mt-6">
            Once approved, you’ll be able to see how your school’s students are engaging with Inzira.
          </p>
        </div>
      </div>
    )
  }

  const confidence = dashLoading || dashError
    ? null
    : confidenceLabel(dashboard?.avgConfidence ?? 0)

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
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-sm text-accent hover:underline"
        >
          <RefreshCw size={14} />
          Get all latest stats →
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {dashLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError ? '—' : (dashboard?.totalStudents ?? '—')}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Students Registered</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError ? '—' : (dashboard?.totalSessions ?? '—')}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Sessions Completed</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className={`text-2xl font-bold ${confidence?.className ?? 'text-primary'}`}>
                {dashError ? '—' : (confidence?.text ?? '—')}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Average Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate areas and trends */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Candidate areas and trends</h2>
          <p className="text-xs text-muted mt-1">Popular career sectors among your school's students</p>

          <div className="space-y-3 mt-4">
            {FALLBACK_SECTORS.map((sector) => (
              <div key={sector} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSectorStyle(sector).bg }}
                />
                <span className="text-sm text-primary flex-1">{sector}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coming up */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Coming up</p>
          {gsLoading ? (
            <div className="animate-pulse bg-border rounded h-10" />
          ) : groupSessions.length === 0 ? (
            <p className="text-xs text-muted">No upcoming group sessions.</p>
          ) : (
            <div className="space-y-2">
              {groupSessions.map((gs) => (
                <div key={gs.id}>
                  <p className="text-xs font-semibold text-accent">
                    {new Date(gs.scheduledAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-xs text-primary">{gs.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-base font-semibold text-primary">Recent activity at your school</h2>
        {dashLoading ? (
          <div className="mt-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-border rounded h-10" />
            ))}
          </div>
        ) : dashError ? (
          <p className="text-sm text-muted mt-4">Unable to load activity data.</p>
        ) : (
          <p className="text-sm text-muted mt-4">No recent activity to show.</p>
        )}
      </div>
    </div>
  )
}

export default CareerGuideHome
