import { useState } from 'react'
import { Trash2, AlertCircle, Pencil, Check, X, User } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import {
  professionalDashboardKeys,
  useMentorSlotsQuery,
  type MentorSlot,
} from '@/hooks/queries/professionalDashboardQueries'

interface EditState {
  date: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
  saving: boolean
  error: string
}

const TIMES: Array<{ label: string; hour: number; minute: number }> = []
for (let h = 7; h <= 19; h++) {
  TIMES.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 })
  if (h < 20) TIMES.push({ label: `${String(h).padStart(2, '0')}:30`, hour: h, minute: 30 })
}

const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

const slotTimeRange = (slot: MentorSlot) => {
  const start = new Date(slot.scheduledAt)
  const end = new Date(start.getTime() + slot.durationMins * 60000)
  return `${formatTime(start.getHours(), start.getMinutes())} – ${formatTime(end.getHours(), end.getMinutes())}`
}

const slotDateLabel = (slot: MentorSlot) =>
  new Date(slot.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  })

const slotDateKey = (slot: MentorSlot) =>
  new Date(slot.scheduledAt).toISOString().slice(0, 10)

const minDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const buildScheduledAt = (dateStr: string, hour: number, minute: number) =>
  new Date(`${dateStr}T${formatTime(hour, minute)}:00`).toISOString()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKS_OPTIONS = [2, 4, 8, 12]

const ProfessionalCreateSlots = () => {
  const queryClient = useQueryClient()
  const { data: slots = [], isLoading: loading } = useMentorSlotsQuery()
  const invalidateSlots = () =>
    queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.mentorSlots })
  const [tab, setTab] = useState<'open' | 'booked'>('open')

  const [mode, setMode] = useState<'single' | 'recurring'>('single')
  const [date, setDate] = useState('')
  const [startHour, setStartHour] = useState(10)
  const [startMinute, setStartMinute] = useState(0)
  const [endHour, setEndHour] = useState(10)
  const [endMinute, setEndMinute] = useState(30)
  const [meetLink, setMeetLink] = useState('')
  const [formError, setFormError] = useState('')
  const [adding, setAdding] = useState(false)

  const [recurDays, setRecurDays] = useState<number[]>([])
  const [recurWeeks, setRecurWeeks] = useState(4)

  const toggleRecurDay = (day: number) =>
    setRecurDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)

  const handleStartChange = (hour: number, minute: number) => {
    setStartHour(hour)
    setStartMinute(minute)
    const autoEnd = minute === 30 ? { hour: hour + 1, minute: 0 } : { hour, minute: 30 }
    setEndHour(autoEnd.hour)
    setEndMinute(autoEnd.minute)
  }

  const handleAdd = async () => {
    setFormError('')
    if (!date) { setFormError('Select a date.'); return }
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      setFormError('End time must be after start time.')
      return
    }
    if (!meetLink.trim()) { setFormError('A Google Meet link is required.'); return }

    const scheduledAt = buildScheduledAt(date, startHour, startMinute)
    const durationMins = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)

    setAdding(true)
    try {
      await api.post('/professionals/me/mentor-slots', { scheduledAt, durationMins, meetLink: meetLink.trim() })
      toast.success('Slot created.')
      setDate('')
      setMeetLink('')
      invalidateSlots()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setFormError(msg ?? 'Could not create slot.')
    } finally {
      setAdding(false)
    }
  }

  const handleAddRecurring = async () => {
    setFormError('')
    if (recurDays.length === 0) { setFormError('Select at least one day of the week.'); return }
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      setFormError('End time must be after start time.')
      return
    }
    if (!meetLink.trim()) { setFormError('A Google Meet link is required.'); return }

    setAdding(true)
    try {
      const { data } = await api.post('/professionals/me/mentor-slots/recurring', {
        daysOfWeek: recurDays,
        startHour,
        startMinute,
        endHour,
        endMinute,
        meetLink: meetLink.trim(),
        weeks: recurWeeks,
      })
      const { created, skipped } = data.data
      toast.success(skipped > 0 ? `Created ${created} slots (${skipped} already existed).` : `Created ${created} slots.`)
      setMeetLink('')
      setRecurDays([])
      invalidateSlots()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setFormError(msg ?? 'Could not create recurring slots.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('Delete this slot?')) return
    try {
      await api.delete(`/professionals/me/mentor-slots/${id}`)
      toast.success('Slot removed.')
      invalidateSlots()
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  const startEdit = (slot: MentorSlot) => {
    const dt = new Date(slot.scheduledAt)
    const end = new Date(dt.getTime() + slot.durationMins * 60000)
    setEditingId(slot.id)
    setEditState({
      date: dt.toISOString().slice(0, 10),
      startHour: dt.getHours(),
      startMinute: dt.getMinutes(),
      endHour: end.getHours(),
      endMinute: end.getMinutes(),
      meetLink: slot.meetLink ?? '',
      saving: false,
      error: '',
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditState(null) }

  const handleEditStartChange = (hour: number, minute: number) => {
    if (!editState) return
    const autoEnd = minute === 30 ? { hour: hour + 1, minute: 0 } : { hour, minute: 30 }
    setEditState({ ...editState, startHour: hour, startMinute: minute, endHour: autoEnd.hour, endMinute: autoEnd.minute, error: '' })
  }

  const saveEdit = async () => {
    if (!editState || !editingId) return
    const { date: d, startHour: sh, startMinute: sm, endHour: eh, endMinute: em, meetLink: ml } = editState
    if (!d) { setEditState({ ...editState, error: 'Select a date.' }); return }
    if (eh < sh || (eh === sh && em <= sm)) {
      setEditState({ ...editState, error: 'End time must be after start time.' })
      return
    }
    if (!ml.trim()) { setEditState({ ...editState, error: 'A Google Meet link is required.' }); return }

    const scheduledAt = buildScheduledAt(d, sh, sm)
    const durationMins = (eh * 60 + em) - (sh * 60 + sm)

    setEditState({ ...editState, saving: true, error: '' })
    try {
      await api.put(`/professionals/me/mentor-slots/${editingId}`, { scheduledAt, durationMins, meetLink: ml.trim() })
      toast.success('Slot updated.')
      cancelEdit()
      invalidateSlots()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setEditState({ ...editState, saving: false, error: msg ?? 'Could not update slot.' })
    }
  }

  const openSlots = slots.filter(s => !s.isBooked)
  const bookedSlots = slots.filter(s => s.isBooked)

  const slotsByDate = (list: MentorSlot[]) => {
    const map = new Map<string, { label: string; slots: MentorSlot[] }>()
    for (const slot of list) {
      const key = slotDateKey(slot)
      const existing = map.get(key)
      if (existing) {
        existing.slots.push(slot)
      } else {
        map.set(key, { label: slotDateLabel(slot), slots: [slot] })
      }
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }))
  }

  const openTabContent = slotsByDate(openSlots).length === 0
    ? <p className="text-sm text-muted">No open slots yet.</p>
    : (
      <div className="space-y-5">
        {slotsByDate(openSlots).map(({ key, label, slots: daySlots }) => (
          <div key={key}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
            <div className="space-y-2">
              {daySlots.map(slot => (
                <div key={slot.id}>
                  {editingId === slot.id && editState ? (
                    <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 space-y-3">
                      <div>
                        <label htmlFor={`edit-date-${slot.id}`} className="block text-xs font-medium text-muted mb-1">Date</label>
                        <input
                          id={`edit-date-${slot.id}`}
                          type="date"
                          value={editState.date}
                          min={minDate()}
                          onChange={e => setEditState({ ...editState, date: e.target.value })}
                          className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`edit-start-${slot.id}`} className="block text-xs font-medium text-muted mb-1">Start</label>
                          <select
                            id={`edit-start-${slot.id}`}
                            value={`${editState.startHour}:${editState.startMinute}`}
                            onChange={e => {
                              const [h, m] = e.target.value.split(':').map(Number)
                              handleEditStartChange(h, m)
                            }}
                            className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                          >
                            {TIMES.map(t => (
                              <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`edit-end-${slot.id}`} className="block text-xs font-medium text-muted mb-1">End</label>
                          <select
                            id={`edit-end-${slot.id}`}
                            value={`${editState.endHour}:${editState.endMinute}`}
                            onChange={e => {
                              const [h, m] = e.target.value.split(':').map(Number)
                              setEditState({ ...editState, endHour: h, endMinute: m })
                            }}
                            className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                          >
                            {TIMES.filter(t =>
                              t.hour > editState.startHour || (t.hour === editState.startHour && t.minute > editState.startMinute)
                            ).map(t => (
                              <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`edit-meet-${slot.id}`} className="block text-xs font-medium text-muted mb-1">Meet Link</label>
                        <input
                          id={`edit-meet-${slot.id}`}
                          type="url"
                          value={editState.meetLink}
                          onChange={e => setEditState({ ...editState, meetLink: e.target.value })}
                          className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                        />
                      </div>
                      {editState.error && <p className="text-xs text-error">{editState.error}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={editState.saving}
                          className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          {editState.saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 border border-border text-muted text-xs font-semibold px-3 py-1.5 rounded-lg hover:text-primary transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2 px-3 border border-border rounded-lg hover:border-border/70">
                      <span className="text-sm text-primary">{slotTimeRange(slot)}</span>
                      <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Open</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(slot)} className="text-muted hover:text-accent transition-colors" title="Edit slot">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(slot.id)} className="text-muted hover:text-error transition-colors" title="Delete slot">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )

  const bookedTabContent = bookedSlots.length === 0
    ? <p className="text-sm text-muted">No slots booked yet.</p>
    : (
      <div className="space-y-3">
        {bookedSlots.map(slot => {
          const student = slot.Student
          return (
            <div key={slot.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-primary">{slotDateLabel(slot)}</p>
                  <p className="text-xs text-muted">{slotTimeRange(slot)}</p>
                </div>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">Booked</span>
              </div>
              {student && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <p className="text-sm text-primary">{student.firstName} {student.lastName}</p>
                </div>
              )}
              {slot.meetLink && (
                <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs font-semibold text-accent hover:underline">
                  Open Meet Link ↗
                </a>
              )}
            </div>
          )
        })}
      </div>
    )

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Create Slots</h1>
      <p className="text-sm text-muted mt-1">Set specific times you're available for 1-on-1 mentee sessions.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Create form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-primary mb-4">Add a slot</h2>

          <div className="flex gap-1 bg-background rounded-lg p-1 mb-4">
            <button
              onClick={() => { setMode('single'); setFormError('') }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'single' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-muted hover:text-primary'
              }`}
            >
              Single date
            </button>
            <button
              onClick={() => { setMode('recurring'); setFormError('') }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'recurring' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-muted hover:text-primary'
              }`}
            >
              Recurring weekly
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'single' ? (
              <div>
                <label htmlFor="create-date" className="block text-xs font-medium text-muted mb-1">Date</label>
                <input
                  id="create-date"
                  type="date"
                  value={date}
                  min={minDate()}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
                />
              </div>
            ) : (
              <div>
                <p className="block text-xs font-medium text-muted mb-1">Days of week</p>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleRecurDay(idx)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        recurDays.includes(idx)
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-muted hover:text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-start" className="block text-xs font-medium text-muted mb-1">Start</label>
                <select
                  id="create-start"
                  value={`${startHour}:${startMinute}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    handleStartChange(h, m)
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
                >
                  {TIMES.map(t => (
                    <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="create-end" className="block text-xs font-medium text-muted mb-1">End</label>
                <select
                  id="create-end"
                  value={`${endHour}:${endMinute}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    setEndHour(h)
                    setEndMinute(m)
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
                >
                  {TIMES.filter(t =>
                    t.hour > startHour || (t.hour === startHour && t.minute > startMinute)
                  ).map(t => (
                    <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="create-meet" className="block text-xs font-medium text-muted mb-1">Google Meet Link</label>
              <input
                id="create-meet"
                type="url"
                value={meetLink}
                onChange={e => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle bg-surface"
              />
              <p className="text-xs text-muted mt-1">Students will use this link to join at the scheduled time.</p>
            </div>
            {mode === 'recurring' && (
              <div>
                <label htmlFor="create-weeks" className="block text-xs font-medium text-muted mb-1">Repeat for</label>
                <select
                  id="create-weeks"
                  value={recurWeeks}
                  onChange={e => setRecurWeeks(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
                >
                  {WEEKS_OPTIONS.map(w => (
                    <option key={w} value={w}>{w} weeks</option>
                  ))}
                </select>
              </div>
            )}
            {formError && (
              <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-error text-sm">{formError}</p>
              </div>
            )}
            <button
              onClick={mode === 'single' ? handleAdd : handleAddRecurring}
              disabled={adding}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {adding ? 'Adding...' : mode === 'single' ? 'Add Slot' : 'Create Recurring Slots'}
            </button>
          </div>
        </div>

        {/* Slots panel */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex gap-1 bg-background rounded-lg p-1 mb-5">
            <button
              onClick={() => setTab('open')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'open' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-muted hover:text-primary'
              }`}
            >
              Open
              {openSlots.length > 0 && (
                <span className="ml-1.5 bg-success/15 text-success text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {openSlots.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('booked')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'booked' ? 'bg-surface text-primary shadow-sm border border-border' : 'text-muted hover:text-primary'
              }`}
            >
              Booked
              {bookedSlots.length > 0 && (
                <span className="ml-1.5 bg-accent/15 text-accent text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {bookedSlots.length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <div key={i} className="animate-pulse bg-border rounded h-12" />)}
            </div>
          ) : (
            <>{tab === 'open' ? openTabContent : bookedTabContent}</>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalCreateSlots
