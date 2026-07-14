import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMenteesQuery } from '@/hooks/queries/professionalDashboardQueries'

const ProfessionalMentees = () => {
  const { user } = useAuth()
  const canView = user?.professional?.isVerified !== false && !!user?.professional?.isMentor
  const { data: mentees = [], isLoading: loading, isError: error } = useMenteesQuery(canView)
  const navigate = useNavigate()

  if (user?.professional?.isVerified === false) {
    return <Navigate to="/professional/home" replace />
  }
  if (!user?.professional?.isMentor) {
    return <Navigate to="/professional/home" replace />
  }

  const proCount = mentees.filter((m) => m.plan === 'PRO').length
  const premiumCount = mentees.filter((m) => m.plan === 'PREMIUM').length

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Mentees</h1>
      <p className="text-sm text-muted mt-1">Students currently under your mentorship.</p>

      {/* Stats */}
      <div className="flex gap-3 mt-4 flex-wrap">
        <span className="bg-surface border border-border text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
          {mentees.length} Total
        </span>
        <span className="bg-warning/10 text-warning text-xs font-semibold px-3 py-1.5 rounded-full">
          {proCount} Pro
        </span>
        <span className="bg-success/10 text-success text-xs font-semibold px-3 py-1.5 rounded-full">
          {premiumCount} Premium
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-52" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-error mt-6">Unable to load mentees. Please try again.</p>
      ) : mentees.length === 0 ? (
        <p className="text-sm text-muted mt-6 max-w-sm">
          You have no active mentees yet. Students will appear here once they subscribe to your Pro or Premium tier.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {mentees.map((mentee) => {
            const initials =
              `${mentee.student.firstName[0] ?? ''}${mentee.student.lastName[0] ?? ''}`.toUpperCase()
            const nextDate = mentee.nextSession
              ? new Date(mentee.nextSession).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                })
              : null

            return (
              <div
                key={mentee.id}
                className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                  {initials}
                </div>
                <p className="text-sm font-semibold text-primary mt-3">
                  {mentee.student.firstName} {mentee.student.lastName}
                </p>
                <p className="text-xs text-muted">
                  {mentee.student.level.replace('_', '-')}
                  {mentee.student.combination ? ` · ${mentee.student.combination}` : ''}
                </p>
                <p className="text-xs text-muted mt-2">{mentee.sessionsCompleted} sessions completed</p>
                <p className="text-xs text-muted">
                  {nextDate ? `Next: ${nextDate}` : 'No upcoming session'}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate('/professional/sessions')}
                    className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
                  >
                    View Sessions
                  </button>
                  <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                    Message
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProfessionalMentees
