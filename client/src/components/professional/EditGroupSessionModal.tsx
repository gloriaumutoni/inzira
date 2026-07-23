import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface Session {
  id: string
  title: string
  description?: string
  sector?: string
  scheduledAt: string
  joinLink?: string
  maxStudents: number
  currentEnrollment?: number
}

interface EditGroupSessionModalProps {
  session: Session
  onClose: () => void
  onSuccess: () => void
}

const isValidGoogleMeetLink = (url: string): boolean => {
  try {
    return new URL(url).hostname === 'meet.google.com'
  } catch {
    return false
  }
}

const EditGroupSessionModal = ({ session, onClose, onSuccess }: EditGroupSessionModalProps) => {
  const [title, setTitle] = useState(session.title)
  const [joinLink, setJoinLink] = useState(session.joinLink ?? '')
  const [scheduledAt, setScheduledAt] = useState(session.scheduledAt.slice(0, 16))
  const [maxStudents, setMaxStudents] = useState(session.maxStudents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasEnrollments = (session.currentEnrollment ?? 0) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!isValidGoogleMeetLink(joinLink)) {
      setError('Please enter a valid Google Meet link (https://meet.google.com/...)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { title, joinLink }
      if (!hasEnrollments) {
        body.scheduledAt = new Date(scheduledAt).toISOString()
        body.maxStudents = maxStudents
      }
      await api.patch(`/group-sessions/${session.id}`, body)
      toast.success('Session updated.')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Could not update session.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary">Edit Session</h2>
          <button onClick={onClose} className="text-muted hover:text-primary"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Google Meet Link</label>
            <input type="url" required value={joinLink} onChange={e => setJoinLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            <p className="text-xs text-muted mt-1">Only Google Meet links are accepted.</p>
          </div>
          {!hasEnrollments && (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Date & Time</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Max Students</label>
                <input type="number" value={maxStudents} onChange={e => setMaxStudents(Number(e.target.value))} min={1} max={100} required className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </>
          )}
          {hasEnrollments && (
            <p className="text-xs text-muted bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">Date and capacity cannot be changed once students have registered.</p>
          )}
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditGroupSessionModal
