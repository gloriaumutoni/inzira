import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/axios'
import { useAuth } from '@/contexts/AuthContext'
import { PATHWAY_LEAF_MAP } from '@/constants/pathways'
import type { PathwayLeaf } from '@/constants/pathways'
import { QUIZ_ITEMS, type PathwayLeafCode } from '@/constants/quizItems'
import { useSaveQuizResult, useSavePathway } from '@/hooks/queries/studentQueries'

const SCALE_LABELS = ['Not at all', 'A little', 'Somewhat', 'Very much', 'Extremely']
const LEAF_CODES: PathwayLeafCode[] = [
  'PATH_MS_NATURAL',
  'PATH_MS_APPLIED',
  'PATH_ARTS_HUMANITIES',
  'PATH_LANGUAGES',
]

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

type Scores = Record<PathwayLeafCode, number>

function computeScores(answers: Record<string, number>): Scores {
  const scores = Object.fromEntries(LEAF_CODES.map((c) => [c, 0])) as Scores
  for (const item of QUIZ_ITEMS) {
    const answer = answers[item.id] ?? 3
    for (const [leaf, weight] of Object.entries(item.weights)) {
      scores[leaf as PathwayLeafCode] += (weight ?? 0) * answer
    }
  }
  return scores
}

function rankPathways(scores: Scores): PathwayLeafCode[] {
  return [...LEAF_CODES].sort((a, b) => scores[b] - scores[a])
}

// The 3 answers that most drove a given leaf recommendation — powers the "why" panel.
function topDrivers(leaf: PathwayLeafCode, answers: Record<string, number>) {
  return QUIZ_ITEMS.filter((it) => it.weights[leaf])
    .map((it) => ({ item: it, contribution: (it.weights[leaf] ?? 0) * (answers[it.id] ?? 3) }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type View = 'intro' | 'quiz' | 'results'
const RANK_LABELS = ['#1 Match', '#2 Match']

export default function PathwayQuiz() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const saveQuiz = useSaveQuizResult()
  const savePathway = useSavePathway()

  const [view, setView] = useState<View>('intro')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [scores, setScores] = useState<Scores | null>(null)
  const [ranked, setRanked] = useState<PathwayLeafCode[]>([])
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pinnedCode, setPinnedCode] = useState<string | null>(user?.student?.pathway ?? null)

  const total = QUIZ_ITEMS.length
  let progressPct = 0
  if (view === 'results') progressPct = 100
  else if (view === 'quiz') progressPct = Math.round((currentQ / total) * 100)

  const handleAnswer = (score: number) => {
    const item = QUIZ_ITEMS[currentQ]
    const next = { ...answers, [item.id]: score }
    setAnswers(next)

    if (currentQ < total - 1) {
      setCurrentQ((q) => q + 1)
    } else {
      const s = computeScores(next)
      setScores(s)
      setRanked(rankPathways(s))
      setView('results')
    }
  }

  const handleBack = () => {
    if (currentQ === 0) setView('intro')
    else setCurrentQ((q) => q - 1)
  }

  const handleRetake = () => {
    setView('intro')
    setCurrentQ(0)
    setAnswers({})
    setSaved(false)
    setExpanded(null)
  }

  const handlePinToHome = async (code: string) => {
    try {
      await savePathway.mutateAsync(code)
      const { data } = await api.get('/auth/me')
      setUser(data.data)
      setPinnedCode(code)
    } catch {
      // fail silently
    }
  }

  const top2 = ranked.slice(0, 2)

  const handleSave = async () => {
    if (!scores) return
    try {
      await saveQuiz.mutateAsync({ answers, scores, topPathways: top2 })
      const { data } = await api.get('/auth/me')
      setUser(data.data)
      setSaved(true)
    } catch {
      // fail silently — not critical
    }
  }

  // -------------------------------------------------------------------------
  // Intro
  // -------------------------------------------------------------------------

  if (view === 'intro') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Find your pathway</h1>
          <p className="text-sm text-muted mt-1">{total} questions · ~5 minutes</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <p className="text-sm text-primary leading-relaxed">
            Rwanda's A-Level system has pathway streams. This quiz looks at both your
            <strong> interests</strong> and your <strong>self-rated strengths</strong> to recommend the
            pathways that suit you best — and explains <em>why</em>.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            For each statement, pick a score from <strong>1</strong> (not at all) to <strong>5</strong> (extremely).
            Your top matches appear at the end with the answers that drove them, subject lists, and career areas.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Interests', 'Aptitude', 'Sciences', 'Humanities', 'Languages'].map((tag) => (
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

  // -------------------------------------------------------------------------
  // Quiz
  // -------------------------------------------------------------------------

  if (view === 'quiz') {
    const item = QUIZ_ITEMS[currentQ]
    const selected = answers[item.id]

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              ← Back
            </button>
            <span className="text-xs text-muted">{currentQ + 1} / {total}</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              {item.block === 'interest' ? 'Interest' : 'Strength'}
            </span>
          </div>
          <h2 className="text-base font-semibold text-primary leading-snug">{item.prompt}</h2>

          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handleAnswer(score)}
                className={`flex flex-col items-center gap-1.5 p-1.5 sm:p-3 rounded-xl border transition-all ${
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

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Your recommended pathways</h1>
        <p className="text-sm text-muted mt-1">Based on your answers — tap a card to see why it was recommended</p>
      </div>

      <div className="space-y-3">
        {top2.map((code, idx) => {
          const pathway = PATHWAY_LEAF_MAP[code] as PathwayLeaf
          const isExpanded = expanded === code
          const drivers = topDrivers(code, answers)
          return (
            <div key={code} className="bg-surface rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-border/30 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : code)}
              >
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full shrink-0 mt-0.5 whitespace-nowrap">
                  {RANK_LABELS[idx]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary">{pathway.label}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{pathway.description}</p>
                </div>
                <span className="text-muted text-xs shrink-0 mt-1 font-medium">
                  {isExpanded ? '↑ less' : '↓ why'}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      Why this matched you
                    </p>
                    <ul className="space-y-1.5">
                      {drivers.map(({ item }) => (
                        <li key={item.id} className="flex items-start gap-2 text-xs text-muted">
                          <span className="text-accent mt-0.5">•</span>
                          <span className="leading-relaxed">
                            <span className="text-primary">{item.prompt}</span>
                            <span className="ml-1 text-[10px] uppercase tracking-wide text-accent">
                              ({item.dimension})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pathway.subjects.map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Example careers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {pathway.careerAreas.map((c) => (
                        <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to="/student/get-mentor"
                      state={{ combination: code }}
                      className="text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
                    >
                      Find a mentor for {pathway.label} →
                    </Link>
                    {pinnedCode === code ? (
                      <span className="text-xs bg-success/10 text-success px-3 py-2 rounded-lg font-medium border border-success/20">
                        Saved to home screen ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePinToHome(code)}
                        disabled={savePathway.isPending}
                        className="text-xs bg-accent text-white px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                      >
                        {savePathway.isPending ? 'Saving…' : 'Save to home screen'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Compare CTA — every result routes onward, never a dead end */}
      <Link
        to="/student/compare"
        state={{ topPathways: top2 }}
        className="block w-full text-center text-sm bg-surface border border-accent/40 text-primary py-3 rounded-xl font-medium hover:border-accent transition-colors"
      >
        Compare these pathways side by side →
      </Link>

      <div className="flex flex-col gap-3 pt-1">
        {saved ? (
          <div className="w-full text-center text-sm text-success bg-success/10 py-3 rounded-xl font-medium border border-success/20">
            Saved to your profile ✓
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saveQuiz.isPending}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saveQuiz.isPending ? 'Saving…' : 'Save these to my profile'}
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
