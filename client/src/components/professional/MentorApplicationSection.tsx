import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import { useAuth } from '@/hooks/useAuth'

interface AvailableSlot {
  adminSlotId: string
  start: string
  end: string
  meetLink: string
}

const MentorApplicationSection = () => {
  const { user } = useAuth()
  const status = user?.professional?.mentorApplicationStatus
  const attempts = user?.professional?.mentorApplicationAttempts ?? 0
  const interviewBooking = user?.professional?.interviewBooking as { scheduledAt: string; meetLink: string } | null | undefined

  const [showModal, setShowModal] = useState(false)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchSlots = async () => {
    setSlotsLoading(true)
    try {
      const { data } = await api.get('/interview-slots/available')
      setSlots(data.data.slots ?? [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setSelectedSlot(null)
    setShowModal(true)
    fetchSlots()
  }

  const handleSubmit = async () => {
    if (!selectedSlot || submitting) return
    setSubmitting(true)
    try {
      await api.post('/professionals/me/apply-mentor', {
        adminSlotId: selectedSlot.adminSlotId,
        scheduledAt: selectedSlot.start,
        meetLink: selectedSlot.meetLink,
      })
      toast.success('Interview booked.')
      setShowModal(false)
      window.location.reload()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not submit application.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const uniqueSlots = slots.filter((slot, idx, arr) =>
    arr.findIndex(s => s.adminSlotId === slot.adminSlotId && s.start === slot.start) === idx
  )

  const slotsByDay = uniqueSlots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    const day = new Date(slot.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(slot)
    return acc
  }, {})

  if (status === 'PENDING') {
    if (interviewBooking) {
      const date = new Date(interviewBooking.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const time = new Date(interviewBooking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return (
        <div>
          <h2 className="text-base font-semibold text-primary mb-3">Mentor Interview</h2>
          <div className="bg-surface border border-border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Mentor Screening Interview</p>
                <p className="text-xs text-muted mt-0.5">A short interview with our team to review your mentor application.</p>
                <p className="text-xs text-muted mt-1">{date} · {time}</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <span className="bg-accent/10 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">Scheduled</span>
              {interviewBooking.meetLink && (
                <a href={interviewBooking.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                  Join →
                </a>
              )}
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-primary">Mentor application under review</p>
        <p className="text-xs text-muted mt-1">Our team is reviewing your application. You'll hear back soon.</p>
      </div>
    )
  }

  if (status === 'INTERVIEWED') {
    return (
      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-primary">Interview completed — awaiting decision</p>
        <p className="text-xs text-muted mt-1">We'll email you once the admin has made a decision.</p>
      </div>
    )
  }

  let content: React.ReactNode

  if (status === 'REJECTED') {
    content = (
      <div className="bg-error/10 border border-error/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-error">Request to become Mentor declined</p>
        <p className="text-xs text-muted mt-1">
          Reason: {user?.professional?.mentorRejectionReason ?? 'Your mentor application was not approved.'}
        </p>
      </div>
    )
  } else if (attempts >= 3) {
    content = (
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-base font-semibold text-primary">Mentor applications closed</p>
        <p className="text-sm text-muted mt-1">You have reached the maximum number of mentor applications (3) and are no longer eligible to apply.</p>
      </div>
    )
  } else {
    content = (
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
        <p className="text-base font-semibold text-primary">Want to do more? Become a Mentor.</p>
        <p className="text-sm text-muted mt-1">Mentors can set 1-on-1 availability slots that students can book directly. Your application will be reviewed by our team via a short interview.</p>
        <button
          onClick={handleOpenModal}
          className="mt-4 bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Book a Mentor Interview
        </button>
      </div>
    )
  }

  return (
    <>
      {content}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => { setShowModal(false); setSelectedSlot(null) }}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary">Book your interview slot</h2>
              <button onClick={() => { setShowModal(false); setSelectedSlot(null) }} className="text-muted hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">Pick a time to book your interview with our team — it's confirmed instantly.</p>

            {slotsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-border rounded h-10" />)}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No interview slots are currently available. Check back soon.</p>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(slotsByDay).map(([day, daySlots]) => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map(slot => {
                        const slotKey = `${slot.adminSlotId}__${slot.start}`
                        const isSelected = selectedSlot?.adminSlotId === slot.adminSlotId && selectedSlot?.start === slot.start
                        return (
                          <button
                            key={slotKey}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                              isSelected
                                ? 'bg-accent text-white border-accent'
                                : 'border-border text-primary hover:border-accent'
                            }`}
                          >
                            {new Date(slot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – {new Date(slot.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-4 bg-accent/5 border border-accent/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary">Your interview:</p>
                <p className="text-sm text-muted mt-0.5">
                  {new Date(selectedSlot.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(selectedSlot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-muted mt-1">You will receive a Google Meet link for this interview.</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setSelectedSlot(null) }} className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedSlot || submitting}
                className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Booking...' : 'Book Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MentorApplicationSection
