import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { submitSessionFeedback } from '@/api/sessions.api'
import { toast } from '@/utils/toast'

interface PostSessionFeedbackModalProps {
  sessionId: string
  professionalName: string
  onClose: () => void
  onSuccess: () => void
}

const ConfidenceCircles = ({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) => (
  <div className="flex gap-3 justify-center mt-2">
    {[1, 2, 3, 4, 5].map((n) => (
      <div key={n} className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => onChange(n)}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all ${
            value === n
              ? 'border-accent bg-accent text-white'
              : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          {n}
        </button>
        <span className="text-xs text-muted mt-1 h-4 text-center">
          {n === 1 ? 'No idea' : n === 3 ? 'Some idea' : n === 5 ? 'Very certain' : ''}
        </span>
      </div>
    ))}
  </div>
)

const PostSessionFeedbackModal = ({
  sessionId,
  professionalName,
  onClose,
  onSuccess,
}: PostSessionFeedbackModalProps) => {
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null)
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null)
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null)
  const [wantsFeedback, setWantsFeedback] = useState<boolean | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValid =
    confidenceBefore !== null &&
    confidenceAfter !== null &&
    wasHelpful !== null &&
    (wantsFeedback === false || (wantsFeedback === true && feedbackText.trim().length > 0))

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      await submitSessionFeedback(sessionId, {
        confidenceBefore: confidenceBefore!,
        confidenceAfter: confidenceAfter!,
        wasHelpful: wasHelpful!,
        professionalFeedback: wantsFeedback && feedbackText.trim() ? feedbackText.trim() : undefined,
      })
      toast.success('Feedback submitted successfully')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-primary">Session Feedback</h2>
            <p className="text-xs text-muted mt-0.5">Session with {professionalName}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Q1 */}
          <div>
            <p className="text-sm font-medium text-primary text-center">
              Before this session, how confident did you feel about your career direction?
            </p>
            <ConfidenceCircles value={confidenceBefore} onChange={setConfidenceBefore} />
          </div>

          {/* Q2 */}
          <div>
            <p className="text-sm font-medium text-primary text-center">
              After this session, how confident do you feel now?
            </p>
            <ConfidenceCircles value={confidenceAfter} onChange={setConfidenceAfter} />
          </div>

          {/* Q3 */}
          <div>
            <p className="text-sm font-medium text-primary text-center mb-3">
              Did this session help you get closer to understanding what career you want?
            </p>
            <div className="flex gap-3">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setWasHelpful(v)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    wasHelpful === v
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div>
            <p className="text-sm font-medium text-primary text-center mb-3">
              Do you have any feedback for the professional?
            </p>
            <div className="flex gap-3 mb-3">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setWantsFeedback(v)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    wantsFeedback === v
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {wantsFeedback && (
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                placeholder="Share anything that could help them improve or that you found particularly useful."
                className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full bg-accent text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Submit feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export { PostSessionFeedbackModal }
export default PostSessionFeedbackModal
