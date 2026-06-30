import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useProfessionalDashboard from '@/hooks/useProfessionalDashboard'
import useProfessionalSessions from '@/hooks/useProfessionalSessions'
import ApplyMentorModal from '@/components/professional/ApplyMentorModal'

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

  const [showMentorApplyModal, setShowMentorApplyModal] = useState(false)

  const { stats, loading: statsLoading } = useProfessionalDashboard()
  const { sessions: pending, loading: pendingLoading, refetch } = useProfessionalSessions({ status: 'PENDING' })

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [availLoading, setAvailLoading] = useState(true)
  const [actionState, setActionState] = useState<Record<string, 'confirming' | 'declining' | null>>({})
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calendarStatus = params.get('connected')
    const calendarError = params.get('error')
    if (calendarStatus === 'true') {
      toast.success('Google Calendar connected successfully.')
      window.history.replaceState({}, '', '/professional/home')
    } else if (calendarError === 'calendar_failed') {
      toast.error('Could not connect Google Calendar. Please try again.')
      window.history.replaceState({}, '', '/professional/home')
    }
  }, [])

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
      toast.success('Session confirmed successfully.')
    } catch {
      setCardErrors((e) => ({ ...e, [id]: 'Could not accept. Try again.' }))
      toast.error('Could not confirm session. Please try again.')
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
      toast.success('Session declined.')
    } catch {
      setCardErrors((e) => ({ ...e, [id]: 'Could not decline. Try again.' }))
      toast.error('Could not decline session. Please try again.')
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
      toast.success(next ? 'Profile hidden from new bookings.' : 'Profile is now visible to students.')
    } catch {
      setOutOfOffice(!next)
      toast.error('Could not update profile status.')
    } finally {
      setToggling(false)
    }
  }

  const handleConnectCalendar = async () => {
    try {
      const { data } = await api.get('/google-calendar/auth')
      if (!data?.data?.url) {
        toast.error('Google Calendar is not configured. Please contact support.')
        return
      }
      window.open(data.data.url, '_blank')
    } catch {
      toast.error('Could not connect to Google Calendar. Please try again.')
    }
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

  if (user?.professional?.isVerified === false) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="bg-surface rounded-2xl border border-border p-10 max-w-lg text-center shadow-sm">
          <Clock className="text-warning w-12 h-12 mx-auto" />
          <h2 className="text-xl font-bold text-primary mt-4">
            Your account is under review
          </h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Our team is verifying your professional background using the LinkedIn profile you provided. This usually takes 1–2 business days. You'll receive an email at {user?.email} once your account is approved.
          </p>
          <p className="text-xs text-subtle mt-6">
            Once approved, you'll be able to host group sessions and accept mentorship requests from students.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted mt-1">
          You have {statsLoading ? '…' : (stats?.pendingRequests ?? 0)} new requests waiting for review.
        </p>
      </div>

      {user?.professional?.isVerified && !user?.professional?.isMentor && (
        <>
          {user?.professional?.mentorApplicationStatus === 'INTERVIEWED' ? (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary">Interview complete — awaiting decision</p>
              <p className="text-xs text-muted mt-1">
                Your interview has been completed. We'll email you once the admin has made a decision.
              </p>
            </div>
          ) : user?.professional?.mentorApplicationStatus === 'REJECTED' ? (
            <div className="bg-error/10 border border-error/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary">Application not approved</p>
              <p className="text-xs text-muted mt-1">
                Your mentor application was not approved this time. You can still create group sessions as a verified professional.
              </p>
            </div>
          ) : user?.professional?.mentorApplicationStatus === 'PENDING' ? (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-3">
              <Clock className="text-warning w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Interview scheduled</p>
                <p className="text-xs text-muted mt-0.5">
                  Your interview is scheduled. Join at the agreed time using the link provided. We'll email you once a decision is made.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Ready to mentor students?</p>
                <p className="text-xs text-muted mt-0.5">
                  Apply to become a mentor. You'll pick an interview slot with our team.
                </p>
              </div>
              <button
                onClick={() => setShowMentorApplyModal(true)}
                className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
              >
                Apply to be a Mentor
              </button>
            </div>
          )}
        </>
      )}

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-primary">How mentorship works on Inzira</p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          You mentor students through two formats: free group sessions (up to 30 students, where you share your career story and answer questions), and 1-on-1 free intro calls (20 minutes, one per student). There is no in-person contact required — all sessions happen over video call using the link you provide. You set your own availability and choose which session requests to accept.
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

          <div className="mt-4">
            {user?.professional?.googleCalendarConnected ? (
              <span className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Google Calendar connected
              </span>
            ) : (
              <button
                onClick={handleConnectCalendar}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                Connect Google Calendar
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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

      {showMentorApplyModal && (
        <ApplyMentorModal
          onClose={() => setShowMentorApplyModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}

export default ProfessionalHome
