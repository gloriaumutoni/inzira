import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useAdminInterviewSlots from '@/hooks/useAdminInterviewSlots'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMES: Array<{ label: string; hour: number; minute: number }> = []
for (let h = 8; h <= 17; h++) {
  TIMES.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 })
  TIMES.push({ label: `${String(h).padStart(2, '0')}:30`, hour: h, minute: 30 })
}

const InterviewSlotsPanel = () => {
  const { slots, loading, refetch } = useAdminInterviewSlots()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ dayOfWeek: 1, startHour: 10, startMinute: 0, meetLink: '' })

  const startLabel = TIMES.find((t) => t.hour === form.startHour && t.minute === form.startMinute)?.label ?? '10:00'
  const endHour = form.startMinute === 30 ? form.startHour + 1 : form.startHour
  const endMinute = form.startMinute === 30 ? 0 : 30

  const handleAdd = async () => {
    if (!form.meetLink.trim()) {
      toast.error('A Google Meet link is required.')
      return
    }
    setAdding(true)
    try {
      await api.post('/admin/interview-slots', {
        dayOfWeek: form.dayOfWeek,
        startHour: form.startHour,
        startMinute: form.startMinute,
        endHour,
        endMinute,
        meetLink: form.meetLink.trim(),
      })
      toast.success('Interview slot added.')
      refetch()
    } catch {
      toast.error('Could not add slot. It may already exist.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/interview-slots/${id}`)
      toast.success('Slot removed.')
      refetch()
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-primary mb-4">Weekly Interview Slots</h2>

      {loading ? (
        <div className="animate-pulse bg-border rounded h-8 w-full" />
      ) : slots.length === 0 ? (
        <p className="text-xs text-muted mb-4">No slots set. Add one below.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between text-sm">
              <span className="text-primary">
                {DAYS[slot.dayOfWeek]} {String(slot.startHour).padStart(2, '0')}:{String(slot.startMinute).padStart(2, '0')}–{String(slot.endHour).padStart(2, '0')}:{String(slot.endMinute).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-3">
                <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline truncate max-w-[160px]">
                  Meet link
                </a>
                <button onClick={() => handleDelete(slot.id)} className="text-muted hover:text-error transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">Add slot</p>
        <div className="flex flex-wrap gap-2">
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            className="border border-border rounded-lg px-2 py-1.5 text-sm text-primary bg-surface"
          >
            {DAYS.slice(1, 6).map((d, i) => (
              <option key={i + 1} value={i + 1}>{d}</option>
            ))}
          </select>
          <select
            value={`${form.startHour}:${form.startMinute}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number)
              setForm({ ...form, startHour: h, startMinute: m })
            }}
            className="border border-border rounded-lg px-2 py-1.5 text-sm text-primary bg-surface"
          >
            {TIMES.map((t) => (
              <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
            ))}
          </select>
          <input
            type="url"
            value={form.meetLink}
            onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
            placeholder="https://meet.google.com/..."
            className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm text-primary placeholder:text-subtle"
          />
        </div>
        <p className="text-xs text-muted">Slot duration: 30 minutes (end: {startLabel.replace(/:\d+/, `:${String(endMinute).padStart(2, '0')}`)} → {String(endHour).padStart(2, '0')}:{String(endMinute).padStart(2, '0')})</p>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {adding ? 'Adding...' : 'Add Slot'}
        </button>
      </div>
    </div>
  )
}

export default InterviewSlotsPanel
