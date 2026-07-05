import { useState } from 'react'
import { api } from '@/api/axios'
import type { PendingReflection } from '@/hooks/usePendingReflections'

interface Props {
  reflection: PendingReflection
  studentCombinations: string[]
  onDone: () => void
  onSkip: () => void
}

const CHANGED_THINKING_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
  { label: 'Still unsure', value: null },
] as const

const PostSessionReflectionModal = ({ reflection, studentCombinations, onDone, onSkip }: Props) => {
  const comboOptions = [
    ...new Set([...reflection.combinations, ...studentCombinations]),
  ].filter(Boolean)

  const [combination, setCombination] = useState(comboOptions[0] ?? '')
  const [changedThinking, setChangedThinking] = useState<boolean | null | undefined>(undefined)
  const [score, setScore] = useState(5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleSubmit = async () => {
    if (changedThinking === undefined) return
    setSaving(true)
    try {
      await api.post('/students/me/confidence', {
        score,
        note: note.trim() || undefined,
        combination: combination || undefined,
        sessionId: reflection.sessionId,
        changedThinking,
      })
      onDone()
    } catch {
      // fail silently — user can try again
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-primary">Session reflection</h2>
          <p className="text-xs text-muted mt-0.5">{reflection.title} · {fmtDate(reflection.scheduledAt)}</p>
        </div>

        {comboOptions.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-primary">
              Which combination were you thinking about?
            </label>
            <select
              value={combination}
              onChange={e => setCombination(e.target.value)}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Not specified</option>
              {comboOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-primary">
            Did this session affect your combination thinking?
          </label>
          <div className="flex gap-2">
            {CHANGED_THINKING_OPTIONS.map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setChangedThinking(opt.value)}
                className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-colors ${
                  changedThinking === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border text-muted hover:text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-primary">
            How confident are you in your choice now?
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
            Any takeaways? <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="What stood out from this session?"
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 text-sm py-2 rounded-lg border border-border text-muted hover:text-primary transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || changedThinking === undefined}
            className="flex-1 text-sm py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save reflection'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostSessionReflectionModal
