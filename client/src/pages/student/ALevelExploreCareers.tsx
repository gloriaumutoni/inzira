import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useCareers from '@/hooks/useCareers'
import useProfessionals from '@/hooks/useProfessionals'
import useRecommendedProfessionals from '@/hooks/useRecommendedProfessionals'
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
  const [selectedCombination, setSelectedCombination] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (user?.student?.combination && selectedCombination === undefined) {
      setSelectedCombination(user.student.combination.split(' ')[0])
    } else if (user && selectedCombination === undefined) {
      setSelectedCombination('')
    }
  }, [user])

  const studentCombination = user?.student?.combination?.split(' ')[0] ?? ''
  const [selectedSector, setSelectedSector] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('Popularity')
  const [showAllPros, setShowAllPros] = useState(false)
  const [selectedProSector, setSelectedProSector] = useState('')

  const { stats } = useStats()
  const { careers, loading, error } = useCareers({
    combination: selectedCombination ?? '',
    sector: selectedSector || undefined,
  })
  const { professionals, loading: prosLoading, error: prosError } = useProfessionals({ sector: selectedProSector || undefined })
  const { professionals: recommendedPros, loading: recLoading } = useRecommendedProfessionals()

  useEffect(() => {
    if (window.location.hash === '#professionals') {
      const el = document.getElementById('professionals-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

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
          <span className="text-xs font-semibold text-primary">{stats?.professionals ?? '—'}</span>
          <span className="text-xs text-muted">professionals</span>
        </div>
        <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{stats?.mentors ?? '—'}</span>
          <span className="text-xs text-muted">mentors</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mt-6 flex-wrap items-center">
        <select
          value={selectedCombination ?? ''}
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
      {selectedCombination === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
          ))}
        </div>
      ) : loading ? (
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
          {sorted.map((career) => (
            <div
              key={career.id}
              className="bg-surface border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getSectorStyle(career.sector).bg }}
                />
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: `${getSectorStyle(career.sector).bg}1A`,
                    color: getSectorStyle(career.sector).bg,
                  }}
                >
                  {career.sector}
                </span>
              </div>
              <h3 className="text-base font-bold text-primary mt-3">{career.title}</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-3">{career.description}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {career.combinations.map((combo) => {
                  const isOwn = combo === studentCombination
                  return (
                    <span
                      key={combo}
                      className={[
                        'text-xs px-2 py-0.5 rounded-full border',
                        isOwn
                          ? 'bg-accent text-white border-accent font-semibold'
                          : 'border-border text-muted',
                      ].join(' ')}
                    >
                      {combo}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10" id="professionals-section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-primary">Professionals matching your combination</h2>
            <p className="text-xs text-muted mt-0.5">These professionals are directly linked to careers in your combination</p>
          </div>
        </div>

        {recLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
            ))}
          </div>
        ) : recommendedPros.length === 0 ? (
          <p className="text-sm text-muted">No professionals linked to your combination yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedPros.map((pro) => {
              const style = getSectorStyle(pro.sector)
              const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
              return (
                <div key={pro.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <p className="text-sm font-semibold text-primary mt-3">{pro.firstName} {pro.lastName}</p>
                  <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
                  <span
                    className="inline-block text-xs text-white px-2 py-0.5 rounded-full mt-2"
                    style={{ backgroundColor: style.bg }}
                  >
                    {pro.sector}
                  </span>
                  <div className="mt-3">
                    <Link to={`/student/professional/${pro.id}`} className="text-xs text-accent hover:underline">
                      View Profile →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => setShowAllPros((v) => !v)}
            className="text-xs text-accent hover:underline"
          >
            {showAllPros ? 'Show recommended only' : 'Browse all professionals →'}
          </button>
        </div>

        {showAllPros && (
          <>
            <div className="flex gap-3 flex-wrap items-center mb-4">
              <select
                value={selectedProSector}
                onChange={(e) => setSelectedProSector(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Sectors</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {selectedProSector && (
                <button onClick={() => setSelectedProSector('')} className="text-xs text-accent hover:underline">
                  Clear filter
                </button>
              )}
            </div>

            {prosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
                ))}
              </div>
            ) : prosError ? (
              <p className="text-sm text-muted text-center mt-6">Unable to load professionals. Please try again.</p>
            ) : professionals.length === 0 ? (
              <p className="text-sm text-muted text-center mt-6">
                No professionals found for this sector. Try a different filter or{' '}
                <button onClick={() => setSelectedProSector('')} className="text-accent hover:underline">clear filters</button>{' '}
                to see everyone.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professionals.map((pro) => {
                  const style = getSectorStyle(pro.sector)
                  const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
                  return (
                    <div key={pro.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <p className="text-sm font-semibold text-primary mt-3">{pro.firstName} {pro.lastName}</p>
                      <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
                      <span
                        className="inline-block text-xs text-white px-2 py-0.5 rounded-full mt-2"
                        style={{ backgroundColor: style.bg }}
                      >
                        {pro.sector}
                      </span>
                      <div className="mt-3">
                        <Link to={`/student/professional/${pro.id}`} className="text-xs text-accent hover:underline">
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ALevelExploreCareers
