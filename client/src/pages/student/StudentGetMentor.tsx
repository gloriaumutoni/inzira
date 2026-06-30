import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useMentors from '@/hooks/useMentors'
import SlotPickerModal from '@/components/sessions/SlotPickerModal'
import { getSectorStyle } from '@/utils/sectorColors'

const SECTORS = [
  'Healthcare', 'Technology', 'Finance', 'Education', 'Engineering',
  'Agriculture', 'Law', 'Architecture', 'Arts & Media', 'Business',
]

const StudentGetMentor = () => {
  const { user } = useAuth()
  const [selectedSector, setSelectedSector] = useState('')
  const [search, setSearch] = useState('')
  const [bookingMentor, setBookingMentor] = useState<{ id: string; name: string; jobTitle: string } | null>(null)

  const { mentors, loading, error } = useMentors({ sector: selectedSector || undefined })

  const filtered = mentors.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.jobTitle.toLowerCase().includes(q) ||
      m.employer.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-primary">Find a Mentor</h1>
      <p className="text-sm text-muted mt-1">
        Connect with a Rwandan professional who can guide your career exploration.
      </p>

      <div className="flex flex-wrap gap-3 mt-6 items-center">
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, title, or employer"
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary bg-surface placeholder:text-subtle flex-1 min-w-[200px]"
        />
        {(selectedSector || search) && (
          <button
            onClick={() => { setSelectedSector(''); setSearch('') }}
            className="text-xs text-accent hover:underline"
          >
            Clear filters
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
        <p className="text-sm text-muted text-center mt-12">No mentors available right now. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {filtered.map((mentor) => {
            const style = getSectorStyle(mentor.sector)
            const initials = `${mentor.firstName[0] ?? ''}${mentor.lastName[0] ?? ''}`.toUpperCase()
            const shownCareers = mentor.careers.slice(0, 3)
            const extraCareers = mentor.careers.length - shownCareers.length
            return (
              <div
                key={mentor.id}
                className="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {mentor.firstName} {mentor.lastName}
                    </p>
                    <p className="text-xs text-muted truncate">{mentor.jobTitle} · {mentor.employer}</p>
                  </div>
                </div>
                <span
                  className="inline-block text-xs text-white px-2 py-0.5 rounded-full mt-3"
                  style={{ backgroundColor: style.bg }}
                >
                  {mentor.sector}
                </span>
                <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-3">{mentor.bio}</p>
                {mentor.careers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {shownCareers.map((c) => (
                      <span key={c} className="text-xs bg-background text-primary px-2 py-0.5 rounded-full border border-border">
                        {c}
                      </span>
                    ))}
                    {extraCareers > 0 && (
                      <span className="text-xs text-muted px-2 py-0.5">+{extraCareers} more</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setBookingMentor({ id: mentor.id, name: `${mentor.firstName} ${mentor.lastName}`, jobTitle: mentor.jobTitle })}
                  className="mt-4 bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Book a Session
                </button>
              </div>
            )
          })}
        </div>
      )}

      {bookingMentor && (
        <SlotPickerModal
          mentorId={bookingMentor.id}
          mentorName={bookingMentor.name}
          mentorJobTitle={bookingMentor.jobTitle}
          onClose={() => setBookingMentor(null)}
          onBooked={() => setBookingMentor(null)}
        />
      )}
    </div>
  )
}

export default StudentGetMentor
