import { useState, useMemo } from 'react'
import { MapPin, Calendar, Users } from 'lucide-react'
import useWorkshops from '@/hooks/useWorkshops'
import { getSectorStyle } from '@/utils/sectorColors'

const ALevelWorkshops = () => {
  const [activeSector, setActiveSector] = useState<string>('All')
  const { workshops, loading, error } = useWorkshops()

  const uniqueSectors = useMemo(
    () => Array.from(new Set(workshops.map((w) => w.sector))),
    [workshops],
  )

  const filtered =
    activeSector === 'All'
      ? workshops
      : workshops.filter((w) => w.sector === activeSector)

  const now = new Date()
  const upcomingCount = workshops.filter((w) => new Date(w.scheduledAt) > now).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Workshops</h1>
          <p className="text-sm text-muted mt-1">
            Attend free career workshops hosted by Kigali companies.
          </p>
        </div>
        <button className="border border-border text-primary text-sm px-4 py-2 rounded-lg hover:bg-background transition-colors flex-shrink-0">
          My Registrations
        </button>
      </div>

      {/* Stats pills */}
      {!loading && (
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{workshops.length}</span>
            <span className="text-xs text-muted">Total</span>
          </div>
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{upcomingCount}</span>
            <span className="text-xs text-muted">Upcoming</span>
          </div>
          <div className="bg-surface border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">—</span>
            <span className="text-xs text-muted">Registered</span>
          </div>
        </div>
      )}

      {/* Sector filter tabs */}
      <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
        {['All', ...uniqueSectors].map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            className={[
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeSector === sector
                ? 'bg-primary text-white'
                : 'border border-border text-muted hover:border-primary hover:text-primary',
            ].join(' ')}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Workshop list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <>
              <div className="animate-pulse bg-border rounded-xl h-40" />
              <div className="animate-pulse bg-border rounded-xl h-40" />
              <div className="animate-pulse bg-border rounded-xl h-40" />
            </>
          ) : error ? (
            <p className="text-sm text-muted">Unable to load workshops. Please try again.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted">No workshops available right now. Check back soon.</p>
          ) : (
            filtered.map((ws) => {
              const style = getSectorStyle(ws.sector)
              const date = new Date(ws.scheduledAt).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })
              const registrationCount = ws._count.registrations
              const capacity = ws.maxRegistrations
              return (
                <div
                  key={ws.id}
                  className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-accent">{ws.company.companyName}</span>
                    <span
                      className="text-xs text-white px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: style.bg }}
                    >
                      {ws.sector}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-primary mt-2">{ws.title}</h3>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{ws.description}</p>
                  <div className="flex gap-4 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} />
                      {date}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <MapPin size={12} />
                      {ws.format === 'ONLINE' ? 'Online' : ws.location ?? 'Location TBD'}
                    </span>
                    {capacity !== null && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Users size={12} />
                        {registrationCount}/{capacity} spots
                      </span>
                    )}
                  </div>
                  <button className="bg-primary text-white text-xs px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors mt-3">
                    Register
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Your registrations panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-5 sticky top-24">
            <h3 className="text-sm font-semibold text-primary">Your Registrations</h3>
            <p className="text-xs text-muted mt-2">
              Workshops you register for will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ALevelWorkshops
