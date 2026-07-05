import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import useProfessionals, { Professional } from '@/hooks/useProfessionals'
import { getSectorStyle } from '@/utils/sectorColors'
import ProfessionalProfileModal from '@/components/professionals/ProfessionalProfileModal'
import { COMBINATIONS } from '@/constants/combinations'
import { SECTORS } from '@/constants/sectors'

type FilterMode = 'recommended' | 'combination' | 'career'

const SKELETON_IDS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6']

const MentorCard = ({ pro, onClick }: { pro: Professional; onClick: () => void }) => {
  const style = getSectorStyle(pro.sector)
  const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
  return (
    <button
      type="button"
      className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow text-left w-full"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
        {initials}
      </div>
      <p className="text-sm font-semibold text-primary mt-3">{pro.firstName} {pro.lastName}</p>
      <p className="text-xs text-muted">{pro.jobTitle} · {pro.employer}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        <span
          className="inline-block text-xs text-white px-2 py-0.5 rounded-full"
          style={{ backgroundColor: style.bg }}
        >
          {pro.sector}
        </span>
        {pro.relevantCombinations?.slice(0, 3).map(c => (
          <span key={c} className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {c}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted mt-2 line-clamp-2">{pro.bio}</p>
      <div className="mt-4 w-full bg-primary text-white text-xs py-2 rounded-lg text-center">
        View Profile & Book
      </div>
    </button>
  )
}

const isRecommended = (pro: Professional, combos: string[], sectors: string[]) =>
  combos.some(c => pro.relevantCombinations?.includes(c)) || sectors.includes(pro.sector)

const emptyMessage = (mode: FilterMode, selectedCombination: string | undefined, selectedSector: string | undefined) => {
  if (mode === 'recommended') {
    return 'No mentors match your quiz combinations or career interests yet. Try browsing by combination or career instead.'
  }
  if (mode === 'combination') {
    return selectedCombination
      ? `No mentors available for ${selectedCombination} yet. Try another combination.`
      : 'Choose a combination above to see matching mentors.'
  }
  return selectedSector
    ? `No mentors available in ${selectedSector} yet. Try another career area.`
    : 'Choose a career area above to see matching mentors.'
}

const renderGrid = (
  loading: boolean,
  error: boolean,
  filtered: Professional[],
  emptyMsg: string,
  onSelect: (id: string) => void,
) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {SKELETON_IDS.map(k => (
          <div key={k} className="animate-pulse bg-border rounded-xl h-48" />
        ))}
      </div>
    )
  }
  if (error) {
    return <p className="text-sm text-muted text-center mt-12">Unable to load mentors. Please try again.</p>
  }
  if (filtered.length === 0) {
    return <p className="text-sm text-muted text-center mt-12">{emptyMsg}</p>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {filtered.map(pro => (
        <MentorCard key={pro.id} pro={pro} onClick={() => onSelect(pro.id)} />
      ))}
    </div>
  )
}

const pillClass = (active: boolean) => active
  ? 'text-xs px-3 py-2 rounded-lg font-medium bg-accent text-white border border-accent'
  : 'text-xs px-3 py-2 rounded-lg font-medium bg-surface border border-border text-muted hover:text-primary transition-colors'

const chipClass = (active: boolean) => active
  ? 'text-xs px-3 py-1 rounded-full font-medium bg-accent text-white'
  : 'text-xs px-3 py-1 rounded-full font-medium bg-surface border border-border text-muted hover:text-primary transition-colors'

const StudentGetMentor = () => {
  const { user } = useAuth()
  const location = useLocation()
  const combinationsConsidering = user?.student?.combinationsConsidering ?? []
  const careerInterests = user?.student?.careerInterests ?? []
  const hasRecommendations = combinationsConsidering.length > 0 || careerInterests.length > 0

  // A-Level students already picked a combination, so default to browsing mentors
  // for that combination instead of the quiz-based "recommended" mode meant for
  // O-Level students who are still deciding.
  const ownCombination = user?.student?.level === 'A_LEVEL' ? (user?.student?.combination ?? undefined) : undefined

  const [mode, setMode] = useState<FilterMode>(ownCombination ? 'combination' : (hasRecommendations ? 'recommended' : 'combination'))
  const [selectedCombination, setSelectedCombination] = useState<string | undefined>(ownCombination)
  const [selectedSector, setSelectedSector] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null)

  useEffect(() => {
    const stateCombo = (location.state as { combination?: string } | null)?.combination
    if (stateCombo) {
      setMode('combination')
      setSelectedCombination(stateCombo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const { professionals, loading, error } = useProfessionals({
    isMentor: true,
    combination: mode === 'combination' ? selectedCombination : undefined,
    sector: mode === 'career' ? selectedSector : undefined,
  })

  const filtered = useMemo(() => {
    const base = mode === 'recommended'
      ? professionals.filter(p => isRecommended(p, combinationsConsidering, careerInterests))
      : professionals

    if (!search) return base
    const q = search.toLowerCase()
    return base.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.jobTitle.toLowerCase().includes(q)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionals, mode, search])

  const setModeAndReset = (next: FilterMode) => {
    setMode(next)
    setSelectedCombination(undefined)
    setSelectedSector(undefined)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Get a Mentor</h1>
      <p className="text-sm text-muted mt-1">
        Browse verified professionals and book a 1-on-1 session based on their available slots.
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        {hasRecommendations && (
          <button type="button" onClick={() => setModeAndReset('recommended')} className={pillClass(mode === 'recommended')}>
            Recommended for you
          </button>
        )}
        <button type="button" onClick={() => setModeAndReset('combination')} className={pillClass(mode === 'combination')}>
          By Combination
        </button>
        <button type="button" onClick={() => setModeAndReset('career')} className={pillClass(mode === 'career')}>
          By Career
        </button>
      </div>

      {mode === 'recommended' && (
        <p className="text-xs text-muted mt-3">
          Based on {combinationsConsidering.length > 0 ? `your quiz matches (${combinationsConsidering.join(', ')})` : ''}
          {combinationsConsidering.length > 0 && careerInterests.length > 0 ? ' and ' : ''}
          {careerInterests.length > 0 ? `your career interests (${careerInterests.join(', ')})` : ''}.
        </p>
      )}

      {mode === 'combination' && (
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <select
            value={selectedCombination ?? ''}
            onChange={(e) => setSelectedCombination(e.target.value || undefined)}
            className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
          >
            <option value="">All combinations</option>
            {COMBINATIONS.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
          {selectedCombination && (
            <button type="button" onClick={() => setSelectedCombination(undefined)} className="text-xs text-accent hover:underline">
              Clear
            </button>
          )}
        </div>
      )}

      {mode === 'career' && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SECTORS.map((s) => (
            <button key={s} type="button" onClick={() => setSelectedSector(s === selectedSector ? undefined : s)} className={chipClass(selectedSector === s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface placeholder:text-subtle flex-1 min-w-[200px]"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="text-xs text-accent hover:underline">
            Clear search
          </button>
        )}
      </div>

      {renderGrid(loading, error, filtered, emptyMessage(mode, selectedCombination, selectedSector), setSelectedProfessionalId)}

      {selectedProfessionalId && (
        <ProfessionalProfileModal
          professionalId={selectedProfessionalId}
          onClose={() => setSelectedProfessionalId(null)}
        />
      )}
    </div>
  )
}

export default StudentGetMentor
