import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useMentorSlots from '@/hooks/useMentorSlots'

const CreateSlots = () => {
  const { user } = useAuth()

  if (!user?.professional?.isMentor) {
    return <Navigate to="/professional/home" replace />
  }

  return <CreateSlotsContent />
}

const CreateSlotsContent = () => {
  const { slots, loading, refetch } = useMentorSlots()
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [adding, setAdding] = useState(false)
  const [timeError, setTimeError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (endTime <= startTime) {
      setTimeError('End time must be after start time.')
      return
    }
    setTimeError('')
    setAdding(true)
    try {
      await api.post('/mentor-slots', {
        scheduledAt: new Date(`${date}T${startTime}`).toISOString(),
        endAt: new Date(`${date}T${endTime}`).toISOString(),
        meetLink,
      })
      toast.success('Slot added.')
      setDate('')
      setStartTime('')
      setEndTime('')
      setMeetLink('')
      refetch()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not add slot. It may already exist.'
      toast.error(msg)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this slot?')) return
    try {
      await api.delete(`/mentor-slots/${id}`)
      toast.success('Slot removed.')
      refetch()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not remove slot.'
      toast.error(msg)
    }
  }

  const upcomingSlots = slots.filter((s) => new Date(s.scheduledAt) >= new Date())

  const slotsByDate = upcomingSlots.reduce<Record<string, typeof upcomingSlots>>((acc, slot) => {
    const dateKey = new Date(slot.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    acc[dateKey] = acc[dateKey] ?? []
    acc[dateKey].push(slot)
    return acc
  }, {})

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Create Slots</h1>
      <p className="text-sm text-muted mt-1">
        Set the times you're available for 1-on-1 student sessions. Students will see and book from these slots.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Add slot form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-primary mb-4">Add a time slot</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            {timeError && <p className="text-xs text-error">{timeError}</p>}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Google Meet Link</label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted mt-1">
                This link will be shared with the student when they book this slot.
              </p>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {adding ? 'Adding...' : 'Add Slot'}
            </button>
          </form>
        </div>

        {/* Your slots */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-primary mb-4">Your slots</h2>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="animate-pulse bg-border rounded h-10" />)}
            </div>
          ) : Object.keys(slotsByDate).length === 0 ? (
            <p className="text-sm text-muted">You have no upcoming slots. Add your first slot on the left.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(slotsByDate).map(([dateLabel, dateSlots]) => (
                <div key={dateLabel}>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{dateLabel}</p>
                  <div className="space-y-1">
                    {dateSlots.map((slot) => {
                      const start = new Date(slot.scheduledAt)
                      const end = new Date(start.getTime() + slot.durationMins * 60000)
                      const timeRange = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                      return (
                        <div key={slot.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-primary">{timeRange}</span>
                            <span className={slot.isBooked
                              ? 'bg-success/10 text-success text-xs px-2 py-0.5 rounded-full'
                              : 'bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full'
                            }>
                              {slot.isBooked ? 'Booked' : 'Open'}
                            </span>
                            {slot.isBooked && slot.student && (
                              <span className="text-xs text-muted">
                                {slot.student.firstName} {slot.student.lastName[0]}.
                              </span>
                            )}
                          </div>
                          {!slot.isBooked && (
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="text-muted hover:text-error transition-colors text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateSlots
