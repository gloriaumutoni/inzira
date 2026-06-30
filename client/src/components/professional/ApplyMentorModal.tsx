import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface ApplyMentorModalProps {
  onClose: () => void
  onSuccess: () => void
}

const ApplyMentorModal = ({ onClose, onSuccess }: ApplyMentorModalProps) => {
  const [mentorBio, setMentorBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/professionals/me/apply-mentor', { mentorBio })
      toast.success('Application submitted. We will email you once reviewed.')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not submit application. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-primary">Apply to be a Mentor</h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted mt-2">
          Tell us why you want to mentor students. Your existing profile details and LinkedIn are already on file from your verification.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Why do you want to mentor students?
            </label>
            <textarea
              value={mentorBio}
              onChange={(e) => setMentorBio(e.target.value)}
              rows={4}
              required
              placeholder="Share what draws you to mentoring and what you hope students gain from talking with you."
              className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyMentorModal
