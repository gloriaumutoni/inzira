import { useState, useEffect } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface AvailableSlot {
  id: string
  scheduledAt: string
  duration: number
}

interface SlotPickerModalProps {
  mentorId: string
  mentorName: string
  mentorJobTitle: string
  onClose: () => void
  onBooked: () => void
}

const SKELETON_KEYS = ['sk1', 'sk2', 'sk3', 'sk4']

const SlotPickerModal = ({ mentorId, mentorName, mentorJobTitle, onClose, onBooked }: SlotPickerModalProps) => {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [bookedCount, setBookedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slotsRes, bookedRes] = await Promise.all([
          api.get(`/professionals/${mentorId}/slots`),
          api.get('/students/me/mentor-slots'),
        ])
        setSlots(slotsRes.data.data.slots ?? slotsRes.data.data)
        setBookedCount((bookedRes.data.data.slots ?? []).length)
      } catch {
        toast.error('Could not load available slots.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [mentorId])

  const handleBook = async () => {
    if (!selectedSlotId || booking) return
    setBooking(true)
    try {
      await api.post('/sessions', { professionalId: mentorId, slotId: selectedSlotId })
      toast.success('Session booked successfully!')
      onBooked()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not book session. Please try again.'
      toast.error(msg)
    } finally {
      setBooking(false)
    }
  }

  const atLimit = bookedCount >= 3

  const slotClassName = (selected: boolean) => {
    const base = 'w-full text-left rounded-lg border p-3 transition-colors'
    if (atLimit) return `${base} opacity-50 cursor-not-allowed border-border`
    if (selected) return `${base} border-accent bg-accent/5`
    return `${base} border-border hover:border-accent/50`
  }

  const renderBody = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {SKELETON_KEYS.map(k => (
            <div key={k} className="animate-pulse bg-border rounded-lg h-14" />
          ))}
        </div>
      )
    }
    if (slots.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="text-sm text-muted">No available slots right now.</p>
          <p className="text-xs text-subtle mt-1">Check back later or contact the mentor directly.</p>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {slots.map((slot) => {
          const date = new Date(slot.scheduledAt)
          const selected = selectedSlotId === slot.id
          return (
            <button
              key={slot.id}
              onClick={() => setSelectedSlotId(slot.id)}
              disabled={atLimit}
              className={slotClassName(selected)}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted flex-shrink-0" />
                <span className="text-sm font-medium text-primary">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted flex-shrink-0" />
                <span className="text-xs text-muted">
                  {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' '}· {slot.duration} min
                </span>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <button
        type="button"
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-primary">Book a Session</h2>
            <p className="text-xs text-muted mt-0.5">{mentorName} · {mentorJobTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {atLimit && (
          <div className="mb-4 bg-error/5 border border-error/20 rounded-lg px-3 py-2">
            <p className="text-xs text-error">
              You have 3 upcoming mentor sessions booked. Complete or cancel one before booking another.
            </p>
          </div>
        )}

        {renderBody()}

        {slots.length > 0 && (
          <button
            onClick={handleBook}
            disabled={!selectedSlotId || booking || atLimit}
            className="w-full mt-4 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {booking ? 'Booking…' : 'Confirm Booking'}
          </button>
        )}
      </div>
    </div>
  )
}

export default SlotPickerModal
