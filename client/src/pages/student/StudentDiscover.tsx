import { useState } from 'react'
import useCareers from '@/hooks/useCareers'
import useProfessionals from '@/hooks/useProfessionals'
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

type Tab = 'careers' | 'professionals'
type SortOption = 'Popularity' | 'Newest' | 'A–Z'

const StudentDiscover = () => {
  const [activeTab, setActiveTab] = useState<Tab>('careers')
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedCombination, setSelectedCombination] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('Popularity')

  const { stats } = useStats()
  const { careers, loading: careersLoading } = useCareers({
    sector: selectedSector || undefined,
    combination: selectedCombination || undefined,
  })
  const { professionals, loading: prosLoading, error: prosError } = useProfessionals({
    sector: selectedSector || undefined,
  })

  const sortedCareers = [...careers].sort((a, b) => {
    if (sortBy === 'A–Z') return a.title.localeCompare(b.title)
    return 0
  })

  const sortedProfessionals = [...professionals].sort((a, b) => {
    if (sortBy === 'A–Z') return a.firstName.localeCompare(b.firstName)
    if (sortBy === 'Popularity') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    return 0
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Discover</h1>
      <p className="text-sm text-muted mt-1">Explore careers, find professionals and find your path.</p>

      {/* Stats pills */}
      <div className="flex gap-4 mt-4 flex-wrap">
        <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{stats?.professionals ?? '—'}</span>
          <span className="text-xs text-muted">Professionals</span>
        </div>
        <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{stats?.partnerSchools ?? '—'}</span>
          <span className="text-xs text-muted">Schools</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['careers', 'professionals'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              activeTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-primary',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-4 flex-wrap">
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
        >
          <option value="">All Sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {activeTab === 'careers' && (
          <select
            value={selectedCombination}
            onChange={(e) => setSelectedCombination(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
          >
            <option value="">All Combinations</option>
            {COMBINATIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
        >
          {(['Popularity', 'Newest', 'A–Z'] as SortOption[]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {selectedSector && (
          <button onClick={() => setSelectedSector('')} className="text-xs text-accent hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Careers tab */}
      {activeTab === 'careers' && (
        <>
          {careersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
              ))}
            </div>
          ) : sortedCareers.length === 0 ? (
            <p className="text-sm text-muted text-center mt-12">
              No results found. Try adjusting your filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {sortedCareers.map((career) => {
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
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-white/60">
                        {career.combinations.length} combination{career.combinations.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-white underline cursor-pointer">Learn more</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Professionals tab */}
      {activeTab === 'professionals' && (
        <>
          {prosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
              ))}
            </div>
          ) : prosError ? (
            <p className="text-sm text-muted text-center mt-12">Unable to load professionals. Please try again.</p>
          ) : sortedProfessionals.length === 0 ? (
            <p className="text-sm text-muted text-center mt-12">
              No professionals found{selectedSector ? ` for ${selectedSector}` : ''}. {selectedSector ? 'Try a different filter or ' : ''}<button onClick={() => setSelectedSector('')} className="text-accent hover:underline">clear filters to see everyone</button>.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {sortedProfessionals.map((pro) => {
                const style = getSectorStyle(pro.sector)
                const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
                return (
                  <div
                    key={pro.id}
                    className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
                      {initials}
                    </div>
                    <p className="text-sm font-semibold text-primary mt-3">
                      {pro.firstName} {pro.lastName}
                    </p>
                    <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
                    <span
                      className="inline-block text-xs text-white px-2 py-0.5 rounded-full mt-2"
                      style={{ backgroundColor: style.bg }}
                    >
                      {pro.sector}
                    </span>
                    <p className="text-xs text-muted mt-2 line-clamp-2">{pro.bio}</p>
                    <div className="flex gap-2 mt-4">
                      <button className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors">
                        View Profile
                      </button>
                      <button className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                        Book Session
              </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StudentDiscover
