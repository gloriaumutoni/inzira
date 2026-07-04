import { useState } from 'react'
import { X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useCareerGuideDashboard from '@/hooks/useCareerGuideDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import useCareerGuideStudents from '@/hooks/useCareerGuideStudents'

const CHART_COLORS = { completed: '#16A34A', remaining: '#E2E8F0' }

const CareerGuideHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useCareerGuideDashboard()
  const { sessions: groupSessions, loading: gsLoading } = useGroupSessions(2)
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
        globalThis.location.reload()
      } catch {
        toast.error('Could not resubmit. Please try again.')
      } finally {
        setResubmitting(false)
      }
    }

    const rejectionCount = user.careerGuide.rejectionCount ?? 0

    return (
      <div className="p-6 space-y-6">
        {showResubmitModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <dialog open aria-labelledby="cg-resubmit-title" className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 m-0 border-0">
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
          rejectionCount >= 3 ? (
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

    </div>
  )
}

export default CareerGuideHome
