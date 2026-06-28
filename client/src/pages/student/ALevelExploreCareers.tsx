import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useCareers from '@/hooks/useCareers'
import useStats from '@/hooks/useStats'
import { getSectorStyle } from '@/utils/sectorColors'

const SECTORS = [
  'Healthcare', 'Technology', 'Finance', 'Education', 'Engineering',
  'Agriculture', 'Law', 'Architecture', 'Arts & Media', 'Business', 'Other',
]

const COMBINATIONS = [
  'MPC', 'MPG', 'MEG', 'MHE', 'MCE',
  'PCB', 'BCG', 'HEG', 'HEL', 'HGL',
  'KEG', 'KEL', 'KGL', 'AEG', 'PCG',
]

type SortOption = 'Popularity' | 'Newest' | 'A–Z'

const ALevelExploreCareers = () => {
  const { user } = useAuth()
  const studentCombination = user?.student?.combination ?? ''

  const [selectedCombination, setSelectedCombination] = useState(studentCombination)
  const [selectedSector, setSelectedSector] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('Popularity')

  const { stats } = useStats()
  const { careers, loading, error } = useCareers({
    combination: selectedCombination || undefined,
    sector: selectedSector || undefined,
  })

  const sorted = [...careers].sort((a, b) => {
    if (sortBy === 'A–Z') return a.title.localeCompare(b.title)
    return 0
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Explore Careers</h1>
      <p className="text-sm text-muted mt-1">
        Discover career paths relevant to your combination and beyond.
      </p>

      {/* Stats pills */}
      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{stats?.companies ?? '—'}</span>
          <span className="text-xs text-muted">Companies</span>
        </div>
        <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{stats?.professionals ?? '—'}</span>
          <span className="text-xs text-muted">Professionals</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-6 flex-wrap items-center">
        <select
          value={selectedCombination}
          onChange={(e) => setSelectedCombination(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Show all combinations</option>
          {COMBINATIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {(['Popularity', 'Newest', 'A–Z'] as SortOption[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Career grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-muted text-center mt-12">
          Unable to load careers. Please try again.
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted text-center mt-12">
          No careers found for this combination. Try selecting a different one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sorted.map((career) => {
            const style = getSectorStyle(career.sector)
            return (
              <div
                key={career.id}
                className="rounded-xl p-5 text-white cursor-pointer hover:shadow-md transition-shadow"
                style={{ backgroundColor: style.bg }}
              >
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full uppercase text-white"
                  style={{ backgroundColor: style.badge }}
                >
                  {career.sector}
                </span>
                <h3 className="text-base font-bold text-white mt-3">{career.title}</h3>
                <p className="text-xs text-white/80 mt-2 leading-relaxed line-clamp-3">
                  {career.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {career.combinations.map((combo) => {
                    const isOwn = combo === studentCombination
                    return (
                      <span
                        key={combo}
                        className={[
                          'text-xs px-2 py-0.5 rounded-full',
                          isOwn
                            ? 'bg-white text-primary font-semibold'
                            : 'bg-white/20 text-white',
                        ].join(' ')}
                      >
                        {combo}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-white/80 underline mt-3 cursor-pointer">Learn more</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ALevelExploreCareers
