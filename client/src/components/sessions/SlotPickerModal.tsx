import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface Slot {
  start: string
  end: string
}

interface SlotPickerModalProps {
  mentorId: string
  mentorName: string
  mentorJobTitle: string
  onClose: () => void
  onBooked: () => void
}

const SlotPickerModal = ({ mentorId, mentorName, mentorJobTitle, onClose, onBooked }: SlotPickerModalProps) => {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await api.get(`/professionals/${mentorId}/slots`)
        setSlots(data.data.slots)
      } catch {
        setSlots([])
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [mentorId])

  const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = new Date(slot.start).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    acc[key] = acc[key] ?? []
    acc[key].push(slot)
    return acc
  }, {})

  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      await api.post('/sessions/book-slot', {
        professionalId: mentorId,
        scheduledAt: selectedSlot.start,
      })
      toast.success('Session booked! You can see it under Sessions.')
      onBooked()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not book. Please try again.'
      toast.error(msg)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Book a session</h2>
            <p className="text-sm text-muted mt-0.5">
              {mentorName} · {mentorJobTitle}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="animate-pulse bg-border rounded-lg h-16" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              This mentor has no open slots in the next two weeks. Try joining one of their group sessions instead.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(slotsByDay).map(([day, daySlots]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1 mb-2">
                    <Calendar className="w-3.5 h-3.5" /> {day}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                          selectedSlot?.start === slot.start
                            ? 'bg-accent text-white border-accent'
                            : 'border-border text-primary hover:border-accent'
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSlot && (
          <div className="mt-4 bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-primary">
            You are booking a 30-minute session with {mentorName} on{' '}
            {new Date(selectedSlot.start).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}{' '}
            at{' '}
            {new Date(selectedSlot.start).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            .
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SlotPickerModal
