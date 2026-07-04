import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useStudentDashboard from '@/hooks/useStudentDashboard'
import { api } from '@/api/axios'

interface MentorSlot {
  id: string
  scheduledAt: string
  durationMins: number
  meetLink: string | null
  Professional: { id: string; firstName: string; lastName: string; jobTitle: string }
}

const TABS = ['Group Sessions', 'Mentor Sessions'] as const
type Tab = typeof TABS[number]

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'

const TabBar = ({ tabs, active, onChange }: {
  tabs: readonly string[]
  active: string
  onChange: (t: string) => void
}) => (
  <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
    {tabs.map(t => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={active === t
          ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
          : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors'
        }
      >
        {t}
      </button>
    ))}
  </div>
)

const ALevelHome = () => {
  const { user } = useAuth()
  const { dashboard, loading: dashLoading, error: dashError } = useStudentDashboard()
  const [tab, setTab] = useState<Tab>('Group Sessions')
  const [mentorSlots, setMentorSlots] = useState<MentorSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

  useEffect(() => {
    api.get('/students/me/mentor-slots')
      .then(({ data }) => setMentorSlots(data.data.slots ?? []))
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [])

  const firstName = user?.student?.firstName ?? 'there'
  const combination = user?.student?.combination ?? 'A-Level'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', year: 'numeric' })

  const upcomingGroup = dashboard?.groupSessions.length ?? 0
  const upcomingMentor = mentorSlots.length
  const confidenceScore = dashboard?.latestConfidence?.score ?? null
  const enrolledSessions = dashboard?.groupSessions ?? []

  const renderGroupSessions = () => {
    if (dashLoading) {
      return (
        <div className={GRID}>
          {['a', 'b', 'c', 'd'].map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-32" />
          ))}
        </div>
      )
    }
    if (enrolledSessions.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted">Your upcoming enrolled group sessions will appear here.</p>
          <p className="text-sm text-muted">Visit the Sessions page to browse and enroll.</p>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Your upcoming enrolled group sessions.</p>
        <div className={GRID}>
          {enrolledSessions.map(enr => {
            const gs = enr.groupSession
            const date = new Date(gs.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            const time = new Date(gs.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={enr.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-primary truncate">{gs.title}</p>
                <p className="text-xs text-muted">{gs.professional.firstName} {gs.professional.lastName}</p>
                <p className="text-xs text-muted">{date} · {time}</p>
                {gs.sector && (
                  <span className="self-start text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{gs.sector}</span>
                )}
                <span className="self-start text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium mt-auto">Enrolled</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMentorSessions = () => {
    if (slotsLoading) {
      return (
        <div className={GRID}>
          {['a', 'b', 'c', 'd'].map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-32" />
          ))}
        </div>
      )
    }
    if (mentorSlots.length === 0) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted">Your confirmed upcoming 1-on-1 sessions with mentors will appear here.</p>
          <p className="text-sm text-muted">Browse professionals in Sessions to book a slot.</p>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Your confirmed upcoming 1-on-1 sessions with mentors.</p>
        <div className={GRID}>
          {mentorSlots.map(slot => {
            const pro = slot.Professional
            const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
            const date = new Date(slot.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            const time = new Date(slot.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={slot.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{pro.firstName} {pro.lastName}</p>
                    <p className="text-xs text-muted truncate">{pro.jobTitle}</p>
                  </div>
                </div>
                <p className="text-xs text-muted">{date} · {time} · {slot.durationMins} min</p>
                {slot.meetLink && (
                  <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    Join session ↗
                  </a>
                )}
                <span className="self-start text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium mt-auto">Confirmed</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted mt-0.5">{today}</p>
        </div>
        <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full mt-1">
          {combination}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {dashLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{dashError ? '—' : upcomingGroup}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Group Sessions</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{slotsLoading ? '—' : upcomingMentor}</p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wide">Upcoming Mentor Sessions</p>
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

      <div>
        <div className="mb-6">
          <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as Tab)} />
        </div>

        {tab === 'Group Sessions' && renderGroupSessions()}
        {tab === 'Mentor Sessions' && renderMentorSessions()}
      </div>
    </div>
  )
}

export default ALevelHome
