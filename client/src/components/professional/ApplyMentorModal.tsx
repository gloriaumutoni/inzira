import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface AvailableSlot {
  adminSlotId: string
  start: string
  end: string
  meetLink: string
}

interface ApplyMentorModalProps {
  onClose: () => void
  onSuccess: () => void
}

const ApplyMentorModal = ({ onClose, onSuccess }: ApplyMentorModalProps) => {
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await api.get('/interview-slots/available')
        setSlots(data.data.slots)
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [])

  const slotsByDay = slots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    const d = new Date(slot.start)
    const key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    acc[key] = acc[key] ?? []
    acc[key].push(slot)
    return acc
  }, {})

  const handleSubmit = async () => {
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/professionals/me/apply-mentor', {
        adminSlotId: selectedSlot.adminSlotId,
        scheduledAt: selectedSlot.start,
        meetLink: selectedSlot.meetLink,
      })
      toast.success('Application submitted. Check your email for details.')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not submit application. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
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
            <h2 className="text-lg font-bold text-primary">Apply to be a Mentor</h2>
            <p className="text-sm text-muted mt-1">Pick an interview slot with our team.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6">
          {loadingSlots ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-border rounded-lg h-12" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No interview slots are currently available. Please check back later or contact the admin.
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
                        {new Date(slot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(slot.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSlot && (
          <div className="mt-4 bg-accent/5 border border-accent/20 rounded-lg p-3">
            <p className="text-xs font-semibold text-primary">Your interview</p>
            <p className="text-xs text-muted mt-1">
              {new Date(selectedSlot.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {' at '}
              {new Date(selectedSlot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted mt-0.5">
              Join via:{' '}
              <a href={selectedSlot.meetLink} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {selectedSlot.meetLink}
              </a>
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-error/10 border border-error/20 rounded-lg px-3 py-2">
            <p className="text-error text-sm">{error}</p>
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
            onClick={handleSubmit}
            disabled={!selectedSlot || submitting}
            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApplyMentorModal
