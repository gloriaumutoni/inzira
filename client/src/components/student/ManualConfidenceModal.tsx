import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/axios'
import { STREAM_MAP, isStreamCode } from '@/constants/streams'

interface Props {
  streamCode?: string | null
  onDone: () => void
  onClose: () => void
}

const ManualConfidenceModal = ({ streamCode, onDone, onClose }: Props) => {
  const [score, setScore] = useState(5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const stream = streamCode && isStreamCode(streamCode) ? STREAM_MAP[streamCode] : undefined

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/students/me/confidence', {
        score,
        note: note.trim() || undefined,
        streamCode: stream?.code,
      })
      onDone()
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <h2 className="text-base font-bold text-primary">Log confidence</h2>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-primary">Your pathway stream</span>
          {stream ? (
            <div className="inline-flex items-center gap-2 text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg">
              {stream.name}
            </div>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              <Link to="/student/quiz" className="text-accent hover:underline">Take the quiz</Link> to set your stream.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-primary">
            Confidence level
            <span className="ml-2 text-accent font-bold">{score}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={e => setScore(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>1 — Not at all</span>
            <span>10 — Very confident</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-primary">
            Note <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="What's on your mind?"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm py-2 rounded-lg border border-border text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 text-sm py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManualConfidenceModal
