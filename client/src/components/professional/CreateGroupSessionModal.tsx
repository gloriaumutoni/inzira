import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api/axios'

const SECTORS = [
  'ICT', 'Engineering', 'Healthcare', 'Finance',
  'Education', 'Agriculture', 'Law', 'Architecture',
  'Arts & Media', 'Business', 'Manufacturing', 'Logistics', 'Other',
]

interface CreateGroupSessionModalProps {
  onClose: () => void
  onSuccess: () => void
}

const CreateGroupSessionModal = ({ onClose, onSuccess }: CreateGroupSessionModalProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sector, setSector] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState(60)
  const [maxStudents, setMaxStudents] = useState(30)
  const [joinLink, setJoinLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 16)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinLink.trim()) {
      setError('A Google Meet or Zoom join link is required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/group-sessions', {
        title,
        description,
        sector,
        scheduledAt: new Date(scheduledAt).toISOString(),
        duration: Number(duration),
        maxStudents: Number(maxStudents),
        joinLink: joinLink.trim(),
      })
      onSuccess()
      onClose()
    } catch {
      setError('Could not create session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Create Group Session</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Session Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Day in the Life: Software Engineering"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn or discuss?"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Sector</label>
            <select
              required
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Select a sector</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Date & Time</label>
            <input
              type="datetime-local"
              required
              min={today}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Duration (minutes)</label>
            <input
              type="number"
              required
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Max Students</label>
            <input
              type="number"
              required
              min={1}
              max={30}
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <p className="text-xs text-muted mt-1">Free group sessions are capped at 30 students.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Join Link</label>
            <input
              type="url"
              required
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              placeholder="https://meet.google.com/... (required)"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="border border-border text-primary px-4 py-2 rounded-lg text-sm hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupSessionModal
