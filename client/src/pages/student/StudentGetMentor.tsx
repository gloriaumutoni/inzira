import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useProfessionals from '@/hooks/useProfessionals'
import { getSectorStyle } from '@/utils/sectorColors'
import ProfessionalProfileModal from '@/components/professionals/ProfessionalProfileModal'

const SECTORS = [
  'Healthcare', 'Technology', 'Finance', 'Education', 'Engineering',
  'Agriculture', 'Law', 'Architecture', 'Arts & Media', 'Business', 'Other',
]

const StudentGetMentor = () => {
  const { user } = useAuth()
  const [selectedSector, setSelectedSector] = useState('')
  const [search, setSearch] = useState('')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null)

  void user

  const { professionals, loading, error } = useProfessionals({
    sector: selectedSector || undefined,
    isMentor: true,
  })

  const filtered = professionals.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.jobTitle.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Find a Mentor</h1>
      <p className="text-sm text-muted mt-1">
        Connect with a verified professional for a 1-on-1 session or join their group sessions.
      </p>

      <div className="flex flex-wrap gap-3 mt-6 items-center">
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface"
        >
          <option value="">All Sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface placeholder:text-subtle flex-1 min-w-[200px]"
        />
        {(selectedSector || search) && (
          <button
            onClick={() => { setSelectedSector(''); setSearch('') }}
            className="text-xs text-accent hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-muted text-center mt-12">Unable to load mentors. Please try again.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted text-center mt-12">
          {search || selectedSector ? 'No mentors match your filters.' : 'No mentors available yet. Check back soon.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((pro) => {
            const style = getSectorStyle(pro.sector)
            const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
            return (
              <div
                key={pro.id}
                className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedProfessionalId(pro.id)}
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
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
                <p className="text-xs text-muted mt-2 line-clamp-2">{pro.bio}</p>
                <button className="mt-4 w-full bg-primary text-white text-xs py-2 rounded-lg hover:bg-primary/90 transition-colors">
                  View Profile & Book
                </button>
              </div>
            )
          })}
        </div>
      )}

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
