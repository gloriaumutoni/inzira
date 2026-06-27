import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import useProfessionals from '@/hooks/useProfessionals'
import { getSectorStyle } from '@/utils/sectorColors'
import { api } from '@/api/axios'

interface GroupSession {
  id: string
  title: string
  scheduledAt: string
  duration: number
  sector: string
  professional: { firstName: string; lastName: string }
  _count?: { enrolments: number }
}

const useUpcomingGroupSessions = (limit: number) => {
  const [sessions, setSessions] = useState<GroupSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/group-sessions?limit=${limit}`)
      .then(({ data }) => setSessions(data.data.groupSessions ?? data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [limit])

  return { sessions, loading }
}

const SkeletonCard = () => (
  <div className="animate-pulse bg-border rounded-xl h-24" />
)

const StudentHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const { professionals, loading: prosLoading } = useProfessionals({ limit: 3 })
  const { sessions: groupSessions, loading: gsLoading } = useUpcomingGroupSessions(2)

  const firstName = user?.student?.firstName ?? 'there'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  })

  const upcomingCount = dashboard?.upcomingSessions.length ?? 0
  const workshopsCount = dashboard?.registeredWorkshops.length ?? 0
  const confidenceScore = dashboard?.latestConfidence?.score ?? null

  return (
    <div className="p-6 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted mt-0.5">{today}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {dashLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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
                {dashError ? '—' : workshopsCount}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Workshops Registered</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {dashError || confidenceScore === null ? '—' : `${confidenceScore}/5`}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Career Confidence</p>
            </div>
          </>
        )}
      </div>

      {/* Professionals you might like */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary">Professionals you might like</h2>
          <Link to="/student/discover" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>

        {prosLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-border rounded-xl h-20" />
            <div className="animate-pulse bg-border rounded-xl h-20" />
            <div className="animate-pulse bg-border rounded-xl h-20" />
          </div>
        ) : (
          <div className="space-y-3">
            {professionals.map((pro) => {
              const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
              return (
                <div
                  key={pro.id}
                  className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {pro.firstName} {pro.lastName}
                      </p>
                      <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors">
                      View Profile
                    </button>
                    <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                      Book Session
                    </button>
                  </div>
                </div>
              )
            })}
            {!prosLoading && professionals.length === 0 && (
              <p className="text-sm text-muted">No professionals available yet.</p>
            )}
          </div>
        )}
      </section>

      {/* Upcoming group sessions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-primary">Upcoming group sessions</h2>
          <Link to="/student/sessions" className="text-sm text-accent hover:underline">
            View all sessions
          </Link>
        </div>

        {gsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="animate-pulse bg-border rounded-xl h-40" />
            <div className="animate-pulse bg-border rounded-xl h-40" />
          </div>
        ) : groupSessions.length === 0 ? (
          <p className="text-sm text-muted">No upcoming group sessions right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupSessions.map((gs) => {
              const style = getSectorStyle(gs.sector)
              const date = new Date(gs.scheduledAt).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })
              const time = new Date(gs.scheduledAt).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div
                  key={gs.id}
                  className="rounded-xl p-5 text-white"
                  style={{ backgroundColor: style.bg }}
                >
                  <p className="text-sm font-bold">{gs.title}</p>
                  <p className="text-xs text-white/80 mt-1">
                    {gs.professional.firstName} {gs.professional.lastName}
                  </p>
                  <p className="text-xs text-white/70 mt-2">{date} · {time}</p>
                  <p className="text-xs text-white/70">{gs.duration} min</p>
                  <button className="mt-3 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    Join Session
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentHome
