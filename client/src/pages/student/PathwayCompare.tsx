import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PATHWAY_LEAVES, PATHWAY_LEAF_MAP } from '@/constants/pathways'
import { leafToStream, STREAM_MAP } from '@/constants/streams'
import { usePathwaySupply } from '@/hooks/queries/studentQueries'

const ALL_LEAF_CODES = PATHWAY_LEAVES.map((l) => l.code)

export default function PathwayCompare() {
  const location = useLocation()
  const stateTop = (location.state as { topPathways?: string[] } | null)?.topPathways
  const top = stateTop?.filter((c) => PATHWAY_LEAF_MAP[c]) ?? []

  const [showAll, setShowAll] = useState(top.length < 2)
  const { data: supply, isLoading } = usePathwaySupply()

  const codes = showAll || top.length < 2 ? ALL_LEAF_CODES : top
  const columns = codes.map((c) => PATHWAY_LEAF_MAP[c])

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-primary">Compare pathways</h1>
          <p className="text-sm text-muted mt-1">
            Subjects, careers, and how much mentor support is available for each — so your choice is informed by real supply.
          </p>
        </div>
        {top.length >= 2 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="shrink-0 text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
          >
            {showAll ? 'Show my top 2 only' : 'Compare all pathways'}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {columns.map((pathway) => {
          const stream = leafToStream(pathway.code)
          const s = stream && supply ? supply[stream] : undefined
          return (
            <div key={pathway.code} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-bold text-primary leading-snug">{pathway.label}</h2>
                {stream && (
                  <p className="text-[11px] text-muted mt-1">{STREAM_MAP[stream]?.name} stream</p>
                )}
                <p className="text-xs text-muted mt-2 leading-relaxed">{pathway.description}</p>
              </div>

              {/* Supply signal */}
              <div className="flex flex-wrap gap-1.5">
                {isLoading ? (
                  <span className="text-[11px] text-muted">Loading availability…</span>
                ) : (
                  <>
                    <span className="text-[11px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                      {s?.mentorCount ?? 0} mentors
                    </span>
                    <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {s?.groupSessionCount ?? 0} sessions
                    </span>
                    <span className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                      {s?.storyCount ?? 0} stories
                    </span>
                  </>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1.5">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {pathway.subjects.map((sub) => (
                    <span key={sub} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{sub}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1.5">Careers</p>
                <div className="flex flex-wrap gap-1">
                  {pathway.careerAreas.slice(0, 6).map((c) => (
                    <span key={c} className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>

              <Link
                to="/student/get-mentor"
                state={{ combination: pathway.code }}
                className="mt-auto text-center text-xs bg-surface border border-border text-primary px-3 py-2 rounded-lg hover:border-primary transition-colors"
              >
                Meet a mentor in this pathway →
              </Link>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Link to="/student/quiz" className="text-sm text-muted hover:text-primary transition-colors">
          ← Back to quiz
        </Link>
      </div>
    </div>
  )
}
