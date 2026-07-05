import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/AuthContext'
import { PATHWAY_LEAVES } from '@/constants/pathways'
import type { PathwayLeaf } from '@/constants/pathways'

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------

const SCALE_LABELS = ['Not at all', 'A little', 'Somewhat', 'Very much', 'Extremely']

interface Question {
  text: string
  combos: string[]
}

const QUESTIONS: Question[] = [
  {
    text: 'How much do you enjoy Mathematics or quantitative subjects?',
    combos: ['PATH_MS_APPLIED', 'PATH_MS_NATURAL'],
  },
  {
    text: 'How much do you enjoy Biology or Life Sciences?',
    combos: ['PATH_MS_NATURAL'],
  },
  {
    text: 'How much do you enjoy Physics or Chemistry?',
    combos: ['PATH_MS_NATURAL'],
  },
  {
    text: 'How much do you enjoy History or the study of society?',
    combos: ['PATH_ARTS_HUMANITIES'],
  },
  {
    text: 'How much do you enjoy languages and communication?',
    combos: ['PATH_LANGUAGES'],
  },
  {
    text: 'Do you see yourself working in healthcare or science?',
    combos: ['PATH_MS_NATURAL'],
  },
  {
    text: 'Do you see yourself working in business, economics, or finance?',
    combos: ['PATH_MS_APPLIED'],
  },
  {
    text: 'Are you interested in engineering or technology?',
    combos: ['PATH_MS_NATURAL', 'PATH_MS_APPLIED'],
  },
  {
    text: 'Are you interested in law or politics?',
    combos: ['PATH_ARTS_HUMANITIES'],
  },
]

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeTopPathways(answers: Record<number, number>): PathwayLeaf[] {
  const scores: Record<string, number> = Object.fromEntries(PATHWAY_LEAVES.map(l => [l.code, 0]))

  for (let i = 0; i < QUESTIONS.length; i++) {
    const score = answers[i] ?? 3
    const q = QUESTIONS[i]
    for (const code of q.combos) scores[code] += score
  }

  return [...PATHWAY_LEAVES].sort((a, b) => (scores[b.code] ?? 0) - (scores[a.code] ?? 0))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type View = 'intro' | 'quiz' | 'results'

const RANK_LABELS = ['#1 Match', '#2 Match']

export default function PathwayQuiz() {
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [topPathways, setTopPathways] = useState<PathwayLeaf[]>([])
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
      setTopPathways(computeTopPathways(newAnswers))
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
      const codes = top2.map(p => p.code)
      await api.patch('/students/me', { combinationsConsidering: codes, pathway: codes[0] })
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
          <h1 className="text-2xl font-bold text-primary">Find your pathway</h1>
          <p className="text-sm text-muted mt-1">9 questions · ~3 minutes</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <p className="text-sm text-primary leading-relaxed">
            Rwanda's A-Level system has 4 pathway streams. This quiz uses your subject preferences
            and career interests to recommend the pathways that suit you best.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            For each question, pick a score from <strong>1</strong> (not at all) to <strong>5</strong> (extremely).
            Your top matches appear at the end with subject lists, career areas, and a description.
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
  const top2 = topPathways.slice(0, 2)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Your recommended pathways</h1>
        <p className="text-sm text-muted mt-1">Based on your answers — tap a card to explore it</p>
      </div>

      <div className="space-y-3">
        {top2.map((pathway, idx) => {
          const isExpanded = expanded === pathway.code
          return (
            <div key={pathway.code} className="bg-surface rounded-xl border border-border overflow-hidden">
              {/* Summary row */}
              <button
                type="button"
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-border/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : pathway.code)}
              >
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full shrink-0 mt-0.5 whitespace-nowrap">
                  {RANK_LABELS[idx]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary">{pathway.label}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{pathway.description}</p>
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
                      {pathway.subjects.map(s => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      Example careers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pathway.careerAreas.map(c => (
                        <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to="/student/get-mentor"
                      state={{ combination: pathway.code }}
                      className="text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
                    >
                      Find a mentor for {pathway.label} →
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
