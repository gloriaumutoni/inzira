import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useGroupSessions from '@/hooks/useGroupSessions'
import GroupSessionCard from '@/components/sessions/GroupSessionCard'

const ALevelHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { sessions: publicGroupSessions, loading: gsLoading } = useGroupSessions(2)

  const firstName = user?.student?.firstName ?? 'there'
  const combination = user?.student?.combination ?? 'A-Level'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  })

  const upcomingCount = dashboard?.upcomingSessions?.length ?? 0
  const confidenceScore = dashboard?.latestConfidence ?? null

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Greeting */}
      <div className="flex items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full mt-1">
          {combination}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dashLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError ? '—' : upcomingCount}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError || confidenceScore === null ? '— / 5' : `${confidenceScore} / 5`}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Career Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Group sessions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary">Upcoming group sessions</h2>
          <Link to="/student/sessions" className="text-sm text-accent hover:underline">
            View all sessions
          </Link>
        </div>

        {gsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="animate-pulse bg-border rounded-xl h-44" />
            <div className="animate-pulse bg-border rounded-xl h-44" />
          </div>
        ) : publicGroupSessions.length === 0 ? (
          <p className="text-sm text-muted">No upcoming group sessions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicGroupSessions.map((gs) => (
              <GroupSessionCard key={gs.id} session={gs} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ALevelHome
