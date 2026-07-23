import { useState } from 'react'
import { AlertTriangle, CheckCircle, ArrowUpDown } from 'lucide-react'
import { useAdminCoverageQuery } from '@/hooks/queries/adminQueries'
import type { StreamCoverage, CareerCoverage } from '@/api/careers.api'

type CareerSortKey = 'title' | 'mentorCount' | 'storyCount' | 'hasRoadmap'

function sortCareers(list: CareerCoverage[], key: CareerSortKey, asc: boolean): CareerCoverage[] {
  return [...list].sort((a, b) => {
    let diff = 0
    if (key === 'title') diff = a.title.localeCompare(b.title)
    else if (key === 'mentorCount') diff = a.mentorCount - b.mentorCount
    else if (key === 'storyCount') diff = a.storyCount - b.storyCount
    else if (key === 'hasRoadmap') diff = Number(a.hasRoadmap) - Number(b.hasRoadmap)
    return asc ? diff : -diff
  })
}

function SortHeader({
  label,
  col,
  current,
  asc,
  onSort,
}: {
  label: string
  col: CareerSortKey
  current: CareerSortKey
  asc: boolean
  onSort: (col: CareerSortKey) => void
}) {
  return (
    <th
      className="text-left px-4 py-3 font-medium cursor-pointer select-none"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={current === col ? 'text-accent' : 'text-border'} />
      </span>
    </th>
  )
}

export default function AdminCoverage() {
  const { data, isLoading, isError } = useAdminCoverageQuery()
  const [sortKey, setSortKey] = useState<CareerSortKey>('hasRoadmap')
  const [sortAsc, setSortAsc] = useState(true)
  const [gapOnly, setGapOnly] = useState(false)

  const handleSort = (key: CareerSortKey) => {
    if (key === sortKey) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-border rounded-xl h-20" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-error text-sm">Failed to load coverage data.</p>
      </div>
    )
  }

  const sortedCareers = sortCareers(
    gapOnly ? data.byCareer.filter((c) => !c.hasRoadmap || c.mentorCount === 0) : data.byCareer,
    sortKey,
    sortAsc,
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary">Coverage Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">
          Which streams and careers are under-served by mentors and stories.
        </p>
      </div>

      {/* Stream summary (3 rows) */}
      <section>
        <h2 className="text-sm font-semibold text-primary mb-3">By Stream</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.byStream.map((s: StreamCoverage) => (
            <div
              key={s.streamCode}
              className={`rounded-xl border p-4 ${
                s.gap ? 'border-error/40 bg-error/5' : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-primary">{s.streamName}</p>
                {s.gap ? (
                  <AlertTriangle size={15} className="text-error" />
                ) : (
                  <CheckCircle size={15} className="text-success" />
                )}
              </div>
              <div className="space-y-1 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Mentors</span>
                  <span className={s.mentorCount === 0 ? 'text-error font-semibold' : 'text-primary font-medium'}>
                    {s.mentorCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Stories</span>
                  <span className={s.storyCount === 0 ? 'text-error font-semibold' : 'text-primary font-medium'}>
                    {s.storyCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Careers</span>
                  <span className="text-primary font-medium">{s.careerCount}</span>
                </div>
              </div>
              {s.gap && (
                <p className="mt-2 text-xs text-error">
                  Gap: {s.mentorCount === 0 ? 'no mentors' : ''}{s.mentorCount === 0 && s.storyCount === 0 ? ' & ' : ''}{s.storyCount === 0 ? 'no stories' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Gap callouts */}
      {data.emptyStreams.length > 0 && (
        <div className="flex items-start gap-3 bg-error/5 border border-error/20 rounded-xl p-4">
          <AlertTriangle size={16} className="text-error mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-error">Streams with zero coverage</p>
            <p className="text-xs text-muted mt-0.5">{data.emptyStreams.join(', ')}</p>
          </div>
        </div>
      )}

      {/* Per-career table */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-primary">By Career</h2>
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={gapOnly}
              onChange={(e) => setGapOnly(e.target.checked)}
              className="rounded"
            />
            Show gaps only
          </label>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-muted text-xs uppercase tracking-wide">
              <tr>
                <SortHeader label="Career" col="title" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Mentors" col="mentorCount" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Stories" col="storyCount" current={sortKey} asc={sortAsc} onSort={handleSort} />
                <SortHeader label="Roadmap" col="hasRoadmap" current={sortKey} asc={sortAsc} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedCareers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-muted">
                    No careers match the current filter.
                  </td>
                </tr>
              )}
              {sortedCareers.map((career) => (
                <tr key={career.careerId} className="hover:bg-background transition">
                  <td className="px-4 py-3 font-medium text-primary">{career.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${career.mentorCount === 0 ? 'text-error' : 'text-success'}`}>
                      {career.mentorCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${career.storyCount === 0 ? 'text-error' : 'text-success'}`}>
                      {career.storyCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {career.hasRoadmap ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle size={12} /> Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-error">
                        <AlertTriangle size={12} /> Missing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-2">
          {data.careersMissingRoadmap.length} career{data.careersMissingRoadmap.length !== 1 ? 's' : ''} missing a roadmap.
        </p>
      </section>
    </div>
  )
}
