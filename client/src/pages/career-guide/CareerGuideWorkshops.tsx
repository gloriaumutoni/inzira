import { useState } from 'react'
import { MapPin, Users, Calendar } from 'lucide-react'
import useWorkshops from '@/hooks/useWorkshops'
import useGroupSessions from '@/hooks/useGroupSessions'
import { getSectorStyle } from '@/utils/sectorColors'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const CareerGuideWorkshops = () => {
  const [search, setSearch] = useState('')
  const { workshops, loading, error } = useWorkshops()
  const { sessions: groupSessions } = useGroupSessions()

  const filtered = workshops.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.company.companyName.toLowerCase().includes(search.toLowerCase()),
  )

  const totalRegistrations = workshops.reduce((sum, w) => sum + w._count.registrations, 0)

  const sectorCounts = workshops.reduce<Record<string, number>>((acc, w) => {
    acc[w.sector] = (acc[w.sector] ?? 0) + 1
    return acc
  }, {})
  const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])

  const companyCounts = workshops.reduce<Record<string, { name: string; count: number }>>((acc, w) => {
    const id = w.company.id
    if (!acc[id]) acc[id] = { name: w.company.companyName, count: 0 }
    acc[id].count += 1
    return acc
  }, {})
  const topCompanies = Object.values(companyCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Workshops</h1>
          <p className="text-sm text-muted mt-1">Workshops available to your school's students.</p>
        </div>
        <input
          type="text"
          placeholder="Search workshops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-subtle w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{loading ? '—' : workshops.length}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Workshops Available</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{loading ? '—' : totalRegistrations}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Total Registrations</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{groupSessions.length}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Group Sessions Active</p>
        </div>
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
            <p className="text-sm text-muted">Unable to load workshops.</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted">No workshops available right now.</p>
          ) : (
            filtered.map((w) => (
              <div key={w.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                    style={{ backgroundColor: getSectorStyle(w.sector).bg }}
                  >
                    {w.sector}
                  </span>
                  <span className="text-xs text-muted">
                    {w.format === 'IN_PERSON' ? 'In Person' : 'Online'}
                  </span>
                  <span className="text-xs text-muted ml-auto">{formatDate(w.scheduledAt)}</span>
                </div>
                <p className="text-xs font-semibold text-accent mt-2">{w.company.companyName}</p>
                <p className="text-base font-semibold text-primary mt-1">{w.title}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{w.description}</p>
                <div className="flex gap-4 mt-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={12} />
                    {w.format === 'IN_PERSON' ? (w.location ?? 'TBD') : 'Online'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Users size={12} />
                    {w._count.registrations}
                    {w.maxRegistrations ? ` / ${w.maxRegistrations}` : ''} registered
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Calendar size={12} />
                    {formatDate(w.scheduledAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="bg-surface rounded-xl border border-border p-5 h-fit">
          <h2 className="text-sm font-semibold text-primary">Workshops by sector</h2>

          <div className="space-y-3 mt-4">
            {sortedSectors.length === 0 ? (
              <p className="text-xs text-muted">No data yet.</p>
            ) : (
              sortedSectors.map(([sector, count]) => (
                <div key={sector}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getSectorStyle(sector).bg }}
                    />
                    <span className="text-sm text-primary flex-1">{sector}</span>
                    <span className="text-xs text-muted ml-auto">{count}</span>
                  </div>
                  <div className="bg-border rounded-full h-1 mt-1">
                    <div
                      className="bg-accent rounded-full h-1"
                      style={{
                        width: `${workshops.length > 0 ? (count / workshops.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="border-border my-4" />

          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Workshop leads</p>
          <div className="space-y-2 mt-3">
            {topCompanies.length === 0 ? (
              <p className="text-xs text-muted">No data yet.</p>
            ) : (
              topCompanies.map((c) => (
                <div key={c.name} className="flex justify-between items-center">
                  <span className="text-sm text-primary">{c.name}</span>
                  <span className="text-xs text-muted">{c.count} workshop{c.count !== 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </div>

          <div className="bg-primary rounded-xl p-4 mt-4">
            <p className="text-xs text-white/80">
              Help your students access more career opportunities. Share Inzira with companies in your network.
            </p>
            <p className="text-xs text-accent underline mt-2 cursor-pointer">Learn More</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CareerGuideWorkshops
