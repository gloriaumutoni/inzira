import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import useProfessionalDashboard from '@/hooks/useProfessionalDashboard'
import useProfessionalSessions from '@/hooks/useProfessionalSessions'

const TYPE_BADGE: Record<string, string> = {
  FREE_INTRO: 'bg-accent/10 text-accent',
  PRO:        'bg-warning/10 text-warning',
  PREMIUM:    'bg-success/10 text-success',
}

interface AvailabilitySlot {
  id: string
  dayOfWeek: number
  startHour: number
  isBooked: boolean
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const ProfessionalHome = () => {
  const { user } = useAuth()
  const firstName = user?.professional?.firstName ?? 'there'
  const isActive = useState(user?.professional?.isActive ?? true)
  const [outOfOffice, setOutOfOffice] = useState(!(user?.professional?.isActive ?? true))
  const [toggling, setToggling] = useState(false)

  const { stats, loading: statsLoading } = useProfessionalDashboard()
  const { sessions: pending, loading: pendingLoading, refetch } = useProfessionalSessions({ status: 'PENDING' })

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [availLoading, setAvailLoading] = useState(true)
  const [actionState, setActionState] = useState<Record<string, 'confirming' | 'declining' | null>>({})
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get('/professionals/me/availability')
      .then(({ data }) => setAvailability(data.data ?? []))
      .catch(() => {})
      .finally(() => setAvailLoading(false))
  }, [])

  const handleAccept = async (id: string) => {
    setActionState((s) => ({ ...s, [id]: 'confirming' }))
    setCardErrors((e) => ({ ...e, [id]: '' }))
    try {
      await api.patch(`/sessions/${id}/confirm`)
      refetch()
    } catch {
      setCardErrors((e) => ({ ...e, [id]: 'Could not accept. Try again.' }))
    } finally {
      setActionState((s) => ({ ...s, [id]: null }))
    }
  }

  const handleDecline = async (id: string) => {
    setActionState((s) => ({ ...s, [id]: 'declining' }))
    setCardErrors((e) => ({ ...e, [id]: '' }))
    try {
      await api.patch(`/sessions/${id}/decline`)
      refetch()
    } catch {
      setCardErrors((e) => ({ ...e, [id]: 'Could not decline. Try again.' }))
    } finally {
      setActionState((s) => ({ ...s, [id]: null }))
    }
  }

  const handleToggleOffice = async () => {
    if (toggling) return
    setToggling(true)
    const next = !outOfOffice
    setOutOfOffice(next)
    try {
      await api.patch('/professionals/me', { isActive: !next })
    } catch {
      setOutOfOffice(!next)
    } finally {
      setToggling(false)
    }
  }

  const handleConnectCalendar = async () => {
    try {
      const { data } = await api.get('/google-calendar/auth')
      window.open(data.data.url, '_blank')
    } catch {}
  }

  // Build week columns Mon–Fri for the current week
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const weekDays = DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dayOfWeek = i + 1 // 1=Mon … 5=Fri
    const slots = availability.filter((s) => s.dayOfWeek === dayOfWeek)
    return { label, date: d.getDate(), slots }
  })

  void isActive // suppress unused warning

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted mt-1">
          You have {statsLoading ? '…' : (stats?.pendingRequests ?? 0)} new requests waiting for review.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.pendingRequests ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Pending Requests</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.sessionsCompleted ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Sessions Completed</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.studentsReached ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Students Reached</p>
            </div>
          </>
        )}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming requests */}
        <div>
          <p className="text-base font-semibold text-primary">Incoming Requests</p>
          <p className="text-xs text-muted mt-0.5">
            Free intro requests only — Pro and Premium students book directly from your calendar.
          </p>

          {pendingLoading ? (
            <div className="space-y-3 mt-4">
              <div className="animate-pulse bg-border rounded-xl h-24" />
              <div className="animate-pulse bg-border rounded-xl h-24" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No pending requests right now.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {pending.map((session) => {
                const busy = actionState[session.id] !== null && actionState[session.id] !== undefined
                const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })
                const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                })
                const studentCode = (session.student as unknown as { code?: string }).code
                  ?? `S${session.student.id.slice(0, 6).toUpperCase()}`

                return (
                  <div key={session.id} className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-primary">Student {studentCode}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[session.type] ?? ''}`}>
                        {session.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{date} · {time}</p>
                    {cardErrors[session.id] && (
                      <p className="text-error text-xs mt-1">{cardErrors[session.id]}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDecline(session.id)}
                        disabled={busy}
                        className="border border-border text-muted text-xs px-3 py-1.5 rounded-lg hover:border-error hover:text-error transition-colors disabled:opacity-60"
                      >
                        {actionState[session.id] === 'declining' ? 'Declining…' : 'Decline'}
                      </button>
                      <button
                        onClick={() => handleAccept(session.id)}
                        disabled={busy}
                        className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        {actionState[session.id] === 'confirming' ? 'Accepting…' : 'Accept'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Link to="/professional/sessions" className="text-sm text-accent hover:underline block mt-4">
            View All Pending Requests
          </Link>
        </div>

        {/* Weekly Availability */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-primary">Weekly Availability</p>
            <button
              onClick={handleConnectCalendar}
              className="text-xs text-accent hover:underline"
            >
              Settings
            </button>
          </div>

          {availLoading ? (
            <div className="animate-pulse bg-border rounded-xl h-32 mt-4" />
          ) : (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {weekDays.map(({ label, date, slots }) => (
                <div key={label} className="text-center">
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <p className="text-xs text-subtle mb-2">{date}</p>
                  <div className="space-y-1">
                    {slots.map((slot) => (
                      <span
                        key={slot.id}
                        className={`block text-xs px-2 py-1 rounded-md ${
                          slot.isBooked
                            ? 'bg-border text-muted'
                            : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {slot.startHour}:00
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleConnectCalendar}
            className="text-xs text-accent hover:underline flex items-center gap-1 mt-4"
          >
            <ExternalLink size={12} />
            Connect Google Calendar
          </button>
        </div>
      </div>

      {/* Out of Office toggle */}
      <div className="bg-primary rounded-xl p-4 flex items-center justify-between mt-2">
        <div>
          <p className="text-sm font-semibold text-white">Need a break?</p>
          <p className="text-xs text-white/70 mt-0.5">
            Toggle 'Out of Office' to hide your profile from new bookings.
          </p>
        </div>
        <button
          onClick={handleToggleOffice}
          disabled={toggling}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
            outOfOffice ? 'bg-white/20' : 'bg-accent'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              outOfOffice ? 'left-1' : 'left-5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default ProfessionalHome
