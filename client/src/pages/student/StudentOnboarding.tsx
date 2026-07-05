import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'
import { Career } from '@/types'

const A_LEVEL_COMBINATIONS = [
  'MPC', 'MPG', 'MCE', 'MCB', 'MEG',
  'PCB', 'PCE', 'HEG', 'HGL', 'HGK',
  'HLE', 'BCG', 'MEd', 'AGL', 'MPE',
]

const StudentOnboarding = () => {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const level = user?.student?.level
  const isOLevel = level === 'O_LEVEL'
  const stepCount = 2

  const [step, setStep] = useState(1)
  const [combinationsConsidering, setCombinationsConsidering] = useState<string[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [careersLoading, setCareersLoading] = useState(true)

  useEffect(() => {
    // A-Level students provide combination, confidence, and career interests at signup —
    // there's nothing left to collect here.
    if (!isOLevel) {
      navigate('/student/home', { replace: true })
    }
  }, [isOLevel, navigate])

  useEffect(() => {
    api.get('/careers?limit=500')
      .then(({ data }) => setCareers(data.data.careers ?? data.data ?? []))
      .catch(() => {})
      .finally(() => setCareersLoading(false))
  }, [])

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const careerInterests = Array.from(
    new Set(
      careers
        .filter(c => selectedCareerIds.includes(c.id))
        .map(c => c.sector)
    )
  )

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const patchBody: Record<string, unknown> = {
        careerInterests,
        combinationsConsidering,
        onboardingCompleted: true,
      }
      await api.patch('/students/me', patchBody)

      const { data } = await api.get('/auth/me')
      setUser(data.data)
      setCompleted(true)
    } catch {
      setSubmitting(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-primary">Which A-Level combinations are you considering?</h2>
        <p className="text-sm text-muted mt-1">Select all that apply — you can always change this later.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {A_LEVEL_COMBINATIONS.map(combo => (
          <button
            key={combo}
            type="button"
            onClick={() => toggleItem(combo, combinationsConsidering, setCombinationsConsidering)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              combinationsConsidering.includes(combo)
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-primary border-border hover:border-primary'
            }`}
          >
            {combo}
          </button>
        ))}
      </div>
      {combinationsConsidering.length === 0 && (
        <p className="text-xs text-muted">You can skip this step if you haven't decided yet.</p>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-primary">What careers interest you?</h2>
        <p className="text-sm text-muted mt-1">Select all careers that appeal to you.</p>
      </div>
      {careersLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-full h-9 w-24" />
          ))}
        </div>
      ) : careers.length === 0 ? (
        <p className="text-sm text-muted">No careers available yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
          {careers.map(career => (
            <button
              key={career.id}
              type="button"
              onClick={() => toggleItem(career.id, selectedCareerIds, setSelectedCareerIds)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedCareerIds.includes(career.id)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary border-border hover:border-primary'
              }`}
            >
              {career.title}
            </button>
          ))}
        </div>
      )}
      {selectedCareerIds.length === 0 && !careersLoading && careers.length > 0 && (
        <p className="text-xs text-muted">You can skip this if you're not sure yet.</p>
      )}
    </div>
  )

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 space-y-8 text-center">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center text-2xl mx-auto">
              ✓
            </div>
            <h2 className="text-xl font-bold text-primary">You're all set!</h2>
            <p className="text-sm text-muted leading-relaxed">
              Your profile is ready. Not sure which A-Level combination to choose? Take a short quiz to get
              personalised recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate('/student/quiz', { replace: true })}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Take the combination quiz →
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/home', { replace: true })}
              className="w-full text-sm text-muted hover:text-primary transition-colors py-2"
            >
              Skip, go to dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 space-y-8">
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {Array.from({ length: stepCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted">Step {step} of {stepCount}</p>
        </div>

        <div className="min-h-[220px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>

        <div className="flex justify-between items-center pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < stepCount ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-primary/90 transition-colors"
            >
              {submitting ? 'Saving…' : 'Get started →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentOnboarding
