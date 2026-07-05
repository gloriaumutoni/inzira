import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/AuthContext'
import { COMBINATIONS } from '@/constants/combinations'
import type { CombinationData } from '@/constants/combinations'

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------

const SCALE_LABELS = ['Not at all', 'A little', 'Somewhat', 'Very much', 'Extremely']

interface Question {
  text: string
  combos: string[]
  special?: 'language'
}

const QUESTIONS: Question[] = [
  {
    text: 'How much do you enjoy Mathematics?',
    combos: ['MPC', 'MPG', 'MEG', 'MCE', 'MCB', 'MPE', 'MEd'],
  },
  {
    text: 'How much do you enjoy Biology or Life Sciences?',
    combos: ['PCB', 'BCG', 'MCB'],
  },
  {
    text: 'How much do you enjoy Physics or Chemistry?',
    combos: ['MPC', 'PCB', 'MCB', 'PCE', 'MPE', 'MPG'],
  },
  {
    text: 'How much do you enjoy History or Geography?',
    combos: ['HEG', 'HGL', 'HGK', 'HLE', 'BCG'],
  },
  {
    text: 'How much do you enjoy languages — French or Kinyarwanda?',
    combos: ['HGL', 'HGK', 'HLE', 'AGL'],
  },
  {
    text: 'Do you see yourself working in healthcare or science?',
    combos: ['PCB', 'BCG', 'MCB'],
  },
  {
    text: 'Do you see yourself working in business, economics, or finance?',
    combos: ['MEG', 'HEG', 'PCE', 'MPE', 'HLE', 'MEd', 'AGL'],
  },
  {
    text: 'Are you interested in engineering or building things?',
    combos: ['MPC', 'MPG', 'MCE', 'MPE'],
  },
  {
    text: 'Do you prefer creative or humanities subjects?',
    combos: ['HGL', 'HGK', 'AGL', 'HLE'],
  },
  {
    text: 'How important is it to study mainly in English rather than Kinyarwanda or French?',
    combos: [],
    special: 'language',
  },
]

// English-medium combinations get boosted by the language question score;
// Kinyarwanda/French-medium combinations get inversely boosted (6 - score).
const ENGLISH_MEDIUM = ['MPC', 'PCB', 'HEG', 'MEG', 'MPG', 'MCE', 'PCE', 'MPE', 'BCG']
const LOCAL_MEDIUM = ['HGK', 'AGL', 'HGL']

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeTopCombinations(answers: Record<number, number>): CombinationData[] {
  const scores: Record<string, number> = Object.fromEntries(COMBINATIONS.map(c => [c.code, 0]))

  for (let i = 0; i < QUESTIONS.length; i++) {
    const score = answers[i] ?? 3
    const q = QUESTIONS[i]

    if (q.special === 'language') {
      for (const code of ENGLISH_MEDIUM) scores[code] += score
      for (const code of LOCAL_MEDIUM) scores[code] += (6 - score)
    } else {
      for (const code of q.combos) scores[code] += score
    }
  }

  return [...COMBINATIONS]
    .sort((a, b) => (scores[b.code] ?? 0) - (scores[a.code] ?? 0))
    .slice(0, 5)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type View = 'intro' | 'quiz' | 'results'

const RANK_LABELS = ['#1 Match', '#2 Match', '#3 Match']

export default function CombinationQuiz() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [topCombos, setTopCombos] = useState<CombinationData[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  let progressPct = 0
  if (view === 'results') progressPct = 100
  else if (view === 'quiz') progressPct = Math.round((currentQ / QUESTIONS.length) * 100)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAnswer = (score: number) => {
    const newAnswers = { ...answers, [currentQ]: score }
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      setTopCombos(computeTopCombinations(newAnswers))
      setView('results')
    }
  }

  const handleBack = () => {
    if (currentQ === 0) {
      setView('intro')
    } else {
      setCurrentQ(q => q - 1)
    }
  }

  const handleRetake = () => {
    setView('intro')
    setCurrentQ(0)
    setAnswers({})
    setSaved(false)
    setExpanded(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const codes = topCombos.slice(0, 3).map(c => c.code)
      await api.patch('/students/me', { combinationsConsidering: codes })
      const { data } = await api.get('/auth/me')
      setUser(data.data)
      setSaved(true)
    } catch {
      // fail silently — not critical
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Views
  // -------------------------------------------------------------------------

  if (view === 'intro') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Find your A-Level combination</h1>
          <p className="text-sm text-muted mt-1">10 questions · ~3 minutes</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <p className="text-sm text-primary leading-relaxed">
            Rwanda's A-Level system has 15 different subject combinations. This quiz uses your subject preferences
            and career interests to recommend the combinations that suit you best.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            For each question, pick a score from <strong>1</strong> (not at all) to <strong>5</strong> (extremely).
            Your top matches appear at the end with subject lists, university paths, and example careers.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Mathematics', 'Sciences', 'Humanities', 'Languages', 'Career goals'].map(tag => (
              <span key={tag} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setView('quiz')}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Start quiz →
        </button>
      </div>
    )
  }

  if (view === 'quiz') {
    const q = QUESTIONS[currentQ]
    const selected = answers[currentQ]

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              ← Back
            </button>
            <span className="text-xs text-muted">
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
          <h2 className="text-base font-semibold text-primary leading-snug">{q.text}</h2>

          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map(score => (
              <button
                key={score}
                type="button"
                onClick={() => handleAnswer(score)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  selected === score
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-background border-border text-primary hover:border-primary'
                }`}
              >
                <span className="text-xl font-bold leading-none">{score}</span>
                <span className="text-[10px] leading-tight text-center hidden sm:block opacity-80">
                  {SCALE_LABELS[score - 1]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-muted">
            <span>Not at all</span>
            <span>Extremely</span>
          </div>
        </div>

        <p className="text-xs text-muted text-center">
          Tap a number to answer and automatically advance to the next question.
        </p>
      </div>
    )
  }

  // Results view
  const top3 = topCombos.slice(0, 3)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Your recommended combinations</h1>
        <p className="text-sm text-muted mt-1">Based on your answers — tap a card to explore it</p>
      </div>

      <div className="space-y-3">
        {top3.map((combo, idx) => {
          const isExpanded = expanded === combo.code
          return (
            <div key={combo.code} className="bg-surface rounded-xl border border-border overflow-hidden">
              {/* Summary row */}
              <button
                type="button"
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-border/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : combo.code)}
              >
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full shrink-0 mt-0.5 whitespace-nowrap">
                  {RANK_LABELS[idx]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary">{combo.code}</p>
                  <p className="text-xs text-muted mt-0.5">{combo.name}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{combo.description}</p>
                </div>
                <span className="text-muted text-xs shrink-0 mt-1 font-medium">
                  {isExpanded ? '↑ less' : '↓ more'}
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {combo.subjects.map(s => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      University programmes it unlocks
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {combo.universityPaths.map(u => (
                        <span key={u} className="text-xs bg-surface border border-border text-muted px-2 py-0.5 rounded-full">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      Example careers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {combo.careers.map(c => (
                        <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to={`/student/career-library?combination=${combo.code}`}
                      className="text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
                    >
                      Career stories for {combo.code} →
                    </Link>
                    <Link
                      to="/student/get-mentor"
                      state={{ combination: combo.code }}
                      className="text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
                    >
                      Find a mentor for {combo.code} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        {saved ? (
          <div className="w-full text-center text-sm text-success bg-success/10 py-3 rounded-xl font-medium border border-success/20">
            Saved to your profile ✓
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save these to my profile'}
          </button>
        )}

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handleRetake}
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            Retake quiz
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/home')}
            className="text-sm text-muted hover:text-primary transition-colors"
          >
            Back to dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
