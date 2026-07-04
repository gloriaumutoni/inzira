import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/api/axios'

const A_LEVEL_COMBINATIONS = [
  'MPC', 'MPG', 'MCE', 'MCB', 'MEG',
  'PCB', 'PCE', 'HEG', 'HGL', 'HGK',
  'HLE', 'BCG', 'MEd', 'AGL', 'MPE',
]

const STEP_COUNT = 3

const StudentOnboarding = () => {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const level = user?.student?.level

  const [step, setStep] = useState(1)
  const [combinationsConsidering, setCombinationsConsidering] = useState<string[]>([])
  const [aLevelCombination, setALevelCombination] = useState(user?.student?.combination ?? '')
  const [sectors, setSectors] = useState<string[]>([])
  const [careerInterests, setCareerInterests] = useState<string[]>([])
  const [confidence, setConfidence] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [sectorsLoading, setSectorsLoading] = useState(true)

  useEffect(() => {
    api.get('/careers/sectors')
      .then(({ data }) => setSectors(data.data ?? []))
      .catch(() => {})
      .finally(() => setSectorsLoading(false))
  }, [])

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const canAdvance = () => {
    if (step === 1) {
      if (level === 'O_LEVEL') return true
      return aLevelCombination.trim() !== ''
    }
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const patchBody: Record<string, unknown> = {
        careerInterests,
        onboardingCompleted: true,
      }
      if (level === 'O_LEVEL') {
        patchBody.combinationsConsidering = combinationsConsidering
      } else {
        patchBody.combination = aLevelCombination
      }

      await Promise.all([
        api.patch('/students/me', patchBody),
        api.post('/students/me/confidence', { score: confidence }),
      ])

      const { data } = await api.get('/auth/me')
      setUser(data.data)
      navigate('/student/home', { replace: true })
    } catch {
      setSubmitting(false)
    }
  }

  const renderStep1 = () => {
    if (level === 'O_LEVEL') {
      return (
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
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-primary">Which combination are you studying?</h2>
          <p className="text-sm text-muted mt-1">Select your current A-Level combination.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {A_LEVEL_COMBINATIONS.map(combo => (
            <button
              key={combo}
              type="button"
              onClick={() => setALevelCombination(combo)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                aLevelCombination === combo
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary border-border hover:border-primary'
              }`}
            >
              {combo}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-primary">What careers interest you?</h2>
        <p className="text-sm text-muted mt-1">Select all sectors that appeal to you.</p>
      </div>
      {sectorsLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-full h-9 w-24" />
          ))}
        </div>
      ) : sectors.length === 0 ? (
        <p className="text-sm text-muted">No sectors available yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sectors.map(sector => (
            <button
              key={sector}
              type="button"
              onClick={() => toggleItem(sector, careerInterests, setCareerInterests)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                careerInterests.includes(sector)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-primary border-border hover:border-primary'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      )}
      {careerInterests.length === 0 && !sectorsLoading && sectors.length > 0 && (
        <p className="text-xs text-muted">You can skip this if you're not sure yet.</p>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-primary">How confident are you in your combination choice?</h2>
        <p className="text-sm text-muted mt-1">
          This becomes your baseline — you can track how your confidence changes over time.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Not at all sure</span>
          <span>Very confident</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={confidence}
          onChange={e => setConfidence(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="text-center">
          <span className="text-3xl font-bold text-primary">{confidence}</span>
          <span className="text-sm text-muted"> / 10</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-8 space-y-8">
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted">Step {step} of {STEP_COUNT}</p>
        </div>

        <div className="min-h-[220px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
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

          {step < STEP_COUNT ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
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
