import { useState } from 'react'
import { toast } from '@/utils/toast'
import useMentorAvailabilityTemplate from '@/hooks/useMentorAvailabilityTemplate'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WORK_DAYS = [1, 2, 3, 4, 5]

const TIMES: Array<{ label: string; hour: number; minute: number }> = []
for (let h = 7; h <= 19; h++) {
  TIMES.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 })
  if (h < 20) TIMES.push({ label: `${String(h).padStart(2, '0')}:30`, hour: h, minute: 30 })
}

const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

const AvailabilityBuilder = () => {
  const { templates, loading, addSlot, removeSlot } = useMentorAvailabilityTemplate()
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startHour, setStartHour] = useState(10)
  const [startMinute, setStartMinute] = useState(0)
  const [endHour, setEndHour] = useState(10)
  const [endMinute, setEndMinute] = useState(30)
  const [adding, setAdding] = useState(false)

  const handleStartChange = (hour: number, minute: number) => {
    setStartHour(hour)
    setStartMinute(minute)
    const autoEnd = minute === 30 ? { hour: hour + 1, minute: 0 } : { hour, minute: 30 }
    setEndHour(autoEnd.hour)
    setEndMinute(autoEnd.minute)
  }

  const handleAdd = async () => {
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      toast.error('End time must be after start time.')
      return
    }
    setAdding(true)
    try {
      await addSlot({ dayOfWeek, startHour, startMinute, endHour, endMinute })
      toast.success('Slot added.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Could not add slot. It may already exist.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this slot?')) return
    try {
      await removeSlot(id)
      toast.success('Slot removed.')
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  const byDay = WORK_DAYS.map((dow) => ({
    dow,
    label: DAY_LABELS[dow],
    slots: templates.filter((t) => t.dayOfWeek === dow),
  })).filter((d) => d.slots.length > 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2">
      <div>
        <h3 className="text-sm font-semibold text-primary mb-4">Add a recurring slot</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Day</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
            >
              {WORK_DAYS.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Start</label>
              <select
                value={`${startHour}:${startMinute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  handleStartChange(h, m)
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
              >
                {TIMES.map((t) => (
                  <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">End</label>
              <select
                value={`${endHour}:${endMinute}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  setEndHour(h)
                  setEndMinute(m)
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
              >
                {TIMES.filter(
                  (t) =>
                    t.hour > startHour ||
                    (t.hour === startHour && t.minute > startMinute)
                ).map((t) => (
                  <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {adding ? 'Adding...' : 'Add Slot'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-primary mb-4">Your weekly schedule</h3>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="animate-pulse bg-border rounded-lg h-12" />)}
          </div>
        ) : byDay.length === 0 ? (
          <p className="text-sm text-muted">You have not set any availability yet. Add your first slot above.</p>
        ) : (
          <div className="space-y-4">
            {byDay.map(({ dow, label, slots }) => (
              <div key={dow}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <span
                      key={slot.id}
                      className="flex items-center gap-1.5 bg-surface border border-border text-sm text-primary px-3 py-1 rounded-full"
                    >
                      {formatTime(slot.startHour, slot.startMinute)} – {formatTime(slot.endHour, slot.endMinute)}
                      <button
                        onClick={() => handleRemove(slot.id)}
                        className="text-muted hover:text-error transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted mt-6">
          These slots repeat every week. Students will see the next 14 days of open slots based on this schedule.
        </p>
      </div>
    </div>
  )
}

export default AvailabilityBuilder
