import { useState } from 'react'
import { Trash2, AlertCircle, Pencil, Check, X, Calendar, User, Mail, Briefcase } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useAdminInterviewSlots, { AdminInterviewSlot } from '@/hooks/useAdminInterviewSlots'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WORK_DAYS = [1, 2, 3, 4, 5]

const TIMES: Array<{ label: string; hour: number; minute: number }> = []
for (let h = 7; h <= 19; h++) {
  TIMES.push({ label: `${String(h).padStart(2, '0')}:00`, hour: h, minute: 0 })
  if (h < 20) TIMES.push({ label: `${String(h).padStart(2, '0')}:30`, hour: h, minute: 30 })
}

const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

interface EditState {
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
  saving: boolean
  error: string
}

const AdminInterviewSlots = () => {
  const { slots, loading, refetch } = useAdminInterviewSlots()
  const [activeTab, setActiveTab] = useState<'open' | 'booked'>('open')

  // Create form state
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startHour, setStartHour] = useState(10)
  const [startMinute, setStartMinute] = useState(0)
  const [endHour, setEndHour] = useState(10)
  const [endMinute, setEndMinute] = useState(30)
  const [meetLink, setMeetLink] = useState('')
  const [adding, setAdding] = useState(false)
  const [timeError, setTimeError] = useState('')

  // Edit state: keyed by slot id
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)

  const openSlots = slots.filter((s) => s.bookings.length === 0)
  const bookedSlots = slots.filter((s) => s.bookings.length > 0)

  const handleStartChange = (hour: number, minute: number) => {
    setStartHour(hour)
    setStartMinute(minute)
    const autoEnd = minute === 30 ? { hour: hour + 1, minute: 0 } : { hour, minute: 30 }
    setEndHour(autoEnd.hour)
    setEndMinute(autoEnd.minute)
  }

  const handleAdd = async () => {
    if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
      setTimeError('End time must be after start time.')
      return
    }
    if (!meetLink.trim()) {
      setTimeError('A Google Meet link is required.')
      return
    }
    setTimeError('')
    setAdding(true)
    try {
      await api.post('/admin/interview-slots', {
        dayOfWeek,
        startHour,
        startMinute,
        endHour,
        endMinute,
        meetLink: meetLink.trim(),
      })
      toast.success('Interview slot added.')
      setMeetLink('')
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'A slot already exists at this day and time.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('Delete this slot?')) return
    try {
      await api.delete(`/admin/interview-slots/${id}`)
      toast.success('Slot removed.')
      refetch()
    } catch {
      toast.error('Could not remove slot.')
    }
  }

  const startEdit = (slot: AdminInterviewSlot) => {
    setEditingId(slot.id)
    setEditState({
      dayOfWeek: slot.dayOfWeek,
      startHour: slot.startHour,
      startMinute: slot.startMinute,
      endHour: slot.endHour,
      endMinute: slot.endMinute,
      meetLink: slot.meetLink,
      saving: false,
      error: '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditState(null)
  }

  const handleEditStartChange = (hour: number, minute: number) => {
    if (!editState) return
    const autoEnd = minute === 30 ? { hour: hour + 1, minute: 0 } : { hour, minute: 30 }
    setEditState({ ...editState, startHour: hour, startMinute: minute, endHour: autoEnd.hour, endMinute: autoEnd.minute, error: '' })
  }

  const saveEdit = async () => {
    if (!editState || !editingId) return
    const { dayOfWeek: d, startHour: sh, startMinute: sm, endHour: eh, endMinute: em, meetLink: ml } = editState
    if (eh < sh || (eh === sh && em <= sm)) {
      setEditState({ ...editState, error: 'End time must be after start time.' })
      return
    }
    if (!ml.trim()) {
      setEditState({ ...editState, error: 'A Google Meet link is required.' })
      return
    }
    setEditState({ ...editState, saving: true, error: '' })
    try {
      await api.put(`/admin/interview-slots/${editingId}`, {
        dayOfWeek: d, startHour: sh, startMinute: sm, endHour: eh, endMinute: em, meetLink: ml.trim(),
      })
      toast.success('Slot updated.')
      cancelEdit()
      refetch()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setEditState({ ...editState, saving: false, error: msg ?? 'Could not update slot.' })
    }
  }

  const slotsByDay = (list: AdminInterviewSlot[]) =>
    WORK_DAYS.map((dow) => ({
      dow,
      label: DAY_LABELS[dow],
      slots: list.filter((s) => s.dayOfWeek === dow),
    })).filter((d) => d.slots.length > 0)

  const openTabContent = slotsByDay(openSlots).length === 0
    ? <p className="text-sm text-muted">No open slots. All slots have been booked or none created yet.</p>
    : (
      <div className="space-y-5">
        {slotsByDay(openSlots).map(({ dow, label, slots: daySlots }) => (
          <div key={dow}>
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
            <div className="space-y-2">
              {daySlots.map((slot) => (
                <div key={slot.id}>
                  {editingId === slot.id && editState ? (
                    <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 space-y-3">
                      <div>
                        <label htmlFor={`edit-day-${slot.id}`} className="block text-xs font-medium text-muted mb-1">Day</label>
                        <select
                          id={`edit-day-${slot.id}`}
                          value={editState.dayOfWeek}
                          onChange={(e) => setEditState({ ...editState, dayOfWeek: Number(e.target.value) })}
                          className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                        >
                          {WORK_DAYS.map((d) => (
                            <option key={d} value={d}>{DAY_LABELS[d]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`edit-start-${slot.id}`} className="block text-xs font-medium text-muted mb-1">Start</label>
                          <select
                            id={`edit-start-${slot.id}`}
                            value={`${editState.startHour}:${editState.startMinute}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':').map(Number)
                              handleEditStartChange(h, m)
                            }}
                            className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                          >
                            {TIMES.map((t) => (
                              <option key={t.label} value={`${t.hour}:${t.minute}`}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`edit-end-${slot.id}`} className="block text-xs font-medium text-muted mb-1">End</label>
                          <select
                            id={`edit-end-${slot.id}`}
                            value={`${editState.endHour}:${editState.endMinute}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':').map(Number)
                              setEditState({ ...editState, endHour: h, endMinute: m })
                            }}
                            className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                          >
                            {TIMES.filter(
                              (t) => t.hour > editState.startHour || (t.hour === editState.startHour && t.minute > editState.startMinute)
                            ).map((t) => (
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
                          onChange={(e) => setEditState({ ...editState, meetLink: e.target.value })}
                          className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-primary bg-surface"
                        />
                      </div>
                      {editState.error && (
                        <p className="text-xs text-error">{editState.error}</p>
                      )}
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
                      <span className="text-sm text-primary">
                        {formatTime(slot.startHour, slot.startMinute)} – {formatTime(slot.endHour, slot.endMinute)}
                      </span>
                      <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Open</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(slot)}
                          className="text-muted hover:text-accent transition-colors"
                          title="Edit slot"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-muted hover:text-error transition-colors"
                          title="Delete slot"
                        >
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
    ? <p className="text-sm text-muted">No slots have been booked yet.</p>
    : (
      <div className="space-y-4">
        {bookedSlots.map((slot) => {
          const booking = slot.bookings[0]
          const pro = booking.professional
          return (
            <div key={slot.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {DAY_LABELS[slot.dayOfWeek]} · {formatTime(slot.startHour, slot.startMinute)} – {formatTime(slot.endHour, slot.endMinute)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3 text-muted" />
                    <p className="text-xs text-muted">
                      Scheduled:{' '}
                      {new Date(booking.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}{' '}
                      at {new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  Booked
                </span>
              </div>
              <div className="bg-background rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <p className="text-sm font-medium text-primary">{pro.firstName} {pro.lastName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <p className="text-xs text-muted">{pro.user.email}</p>
                </div>
                {pro.mentorBio && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted font-medium mb-1">Mentor bio</p>
                    <p className="text-xs text-primary leading-relaxed">{pro.mentorBio}</p>
                  </div>
                )}
                {pro.mentorAppliedAt && (
                  <p className="text-xs text-subtle pt-1">
                    Applied {new Date(pro.mentorAppliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs font-semibold text-accent hover:underline"
              >
                Open Meet Link ↗
              </a>
            </div>
          )
        })}
      </div>
    )

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Interview Slots</h1>
      <p className="text-sm text-muted mt-1">
        Set recurring times you're available to interview mentor applicants. Applicants pick from these slots when applying.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Add slot form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-primary mb-4">Add an interview slot</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="create-day" className="block text-xs font-medium text-muted mb-1">Day of week</label>
              <select
                id="create-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
              >
                {WORK_DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-start" className="block text-xs font-medium text-muted mb-1">Start</label>
                <select
                  id="create-start"
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
                <label htmlFor="create-end" className="block text-xs font-medium text-muted mb-1">End</label>
                <select
                  id="create-end"
                  value={`${endHour}:${endMinute}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number)
                    setEndHour(h)
                    setEndMinute(m)
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
                >
                  {TIMES.filter(
                    (t) => t.hour > startHour || (t.hour === startHour && t.minute > startMinute)
                  ).map((t) => (
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
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle bg-surface"
              />
              <p className="text-xs text-muted mt-1">
                Applicants will use this link to join their interview at the scheduled time.
              </p>
            </div>
            {timeError && (
              <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-error text-sm">{timeError}</p>
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {adding ? 'Adding...' : 'Add Slot'}
            </button>
          </div>
        </div>

        {/* Slots panel with tabs */}
        <div className="bg-surface border border-border rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-background rounded-lg p-1 mb-5">
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'open'
                  ? 'bg-surface text-primary shadow-sm border border-border'
                  : 'text-muted hover:text-primary'
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
              onClick={() => setActiveTab('booked')}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'booked'
                  ? 'bg-surface text-primary shadow-sm border border-border'
                  : 'text-muted hover:text-primary'
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
              {[0, 1, 2].map((i) => <div key={i} className="animate-pulse bg-border rounded h-12" />)}
            </div>
          ) : (
            <>{activeTab === 'open' ? openTabContent : bookedTabContent}</>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminInterviewSlots
