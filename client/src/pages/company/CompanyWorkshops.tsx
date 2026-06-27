import { useState, useEffect } from 'react'
import { MapPin, Monitor, Users, Calendar } from 'lucide-react'
import useCompanyWorkshops from '@/hooks/useCompanyWorkshops'
import CreateWorkshopModal from '@/components/company/CreateWorkshopModal'
import { getSectorStyle } from '@/utils/sectorColors'
import { api } from '@/api/axios'
import type { CompanyWorkshop } from '@/hooks/useCompanyWorkshops'

type Tab = 'Active' | 'Archived' | 'Drafts'

interface RegistrationData {
  total: number
  byLevel: Record<string, number>
  byCombination: Record<string, number>
  bySchool: Record<string, number>
}

const CompanyWorkshops = () => {
  const { workshops, loading, refetch } = useCompanyWorkshops()
  const [tab, setTab] = useState<Tab>('Active')
  const [showModal, setShowModal] = useState(false)
  const [editWorkshop, setEditWorkshop] = useState<CompanyWorkshop | null>(null)
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null)
  const [regData, setRegData] = useState<RegistrationData | null>(null)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState(false)

  const now = new Date()

  const filtered = workshops.filter((w) => {
    if (tab === 'Drafts') return !w.isPublished
    if (tab === 'Active') return w.isPublished && new Date(w.date) > now
    return w.isPublished && new Date(w.date) <= now
  })

  useEffect(() => {
    if (!selectedWorkshopId) return
    const fetch = async () => {
      setRegLoading(true)
      setRegError(false)
      setRegData(null)
      try {
        const { data } = await api.get(`/workshops/${selectedWorkshopId}/registrations`)
        setRegData(data.data)
      } catch {
        setRegError(true)
      } finally {
        setRegLoading(false)
      }
    }
    fetch()
  }, [selectedWorkshopId])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this workshop?')) return
    try {
      await api.delete(`/workshops/${id}`)
      refetch()
    } catch {
      // noop
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/workshops/${id}/publish`)
      refetch()
    } catch {
      // noop
    }
  }

  const openEdit = (w: CompanyWorkshop) => {
    setEditWorkshop(w)
    setShowModal(true)
  }

  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId)

  const topCombinations = regData
    ? Object.entries(regData.byCombination).sort((a, b) => b[1] - a[1])
    : []
  const maxComboCount = topCombinations[0]?.[1] ?? 1

  const topSchools = regData
    ? Object.entries(regData.bySchool).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Workshop Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Manage your upcoming and past career workshops.
          </p>
        </div>
        <button
          onClick={() => { setEditWorkshop(null); setShowModal(true) }}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create Workshop
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['Active', 'Archived', 'Drafts'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 rounded-lg text-sm transition-colors',
              tab === t
                ? 'bg-primary text-white font-medium'
                : 'text-muted hover:text-primary',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Workshop list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <>
              <div className="animate-pulse bg-border rounded-xl h-36" />
              <div className="animate-pulse bg-border rounded-xl h-36" />
            </>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No {tab.toLowerCase()} workshops.</p>
          ) : (
            filtered.map((w) => {
              const style = getSectorStyle(w.sector)
              const isArchived = tab === 'Archived'
              return (
                <div
                  key={w.id}
                  className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: style.bg }}
                    >
                      {w.sector}
                    </span>
                    <span
                      className={[
                        'text-xs px-2 py-0.5 rounded-full',
                        w.isPublished && !isArchived
                          ? 'bg-success/10 text-success'
                          : isArchived
                          ? 'bg-muted/10 text-muted'
                          : 'bg-warning/10 text-warning',
                      ].join(' ')}
                    >
                      {isArchived ? 'Archived' : w.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-muted ml-auto">
                      {w.date ? new Date(w.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      }) : '—'}
                    </span>
                  </div>

                  <p className="text-base font-semibold text-primary mt-2">{w.title}</p>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{w.description}</p>

                  <div className="flex gap-4 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      {w.format === 'IN_PERSON' ? <MapPin size={12} /> : <Monitor size={12} />}
                      {w.format === 'IN_PERSON' ? 'In Person' : 'Online'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Users size={12} />
                      {w.registrationCount}/{w.capacity}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar size={12} />
                      {w.date ? new Date(w.date).toLocaleDateString() : '—'}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    {tab === 'Drafts' && (
                      <>
                        <button
                          onClick={() => openEdit(w)}
                          className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
                        >
                          Edit Draft
                        </button>
                        <button
                          onClick={() => handlePublish(w.id)}
                          className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {(tab === 'Active' || tab === 'Archived') && (
                      <button
                        onClick={() => setSelectedWorkshopId(w.id)}
                        className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-background"
                      >
                        View Registrations
                      </button>
                    )}
                    {tab === 'Active' && (
                      <>
                        <button
                          onClick={() => openEdit(w)}
                          className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          className="border border-border text-muted text-xs px-3 py-1.5 rounded-lg transition-colors cursor-not-allowed opacity-60"
                          disabled
                        >
                          Unpublish
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Registration panel */}
        <div className="bg-surface rounded-xl border border-border p-5 sticky top-24 self-start">
          <h2 className="text-sm font-semibold text-primary">Recent Registrations</h2>

          {!selectedWorkshopId && (
            <p className="text-xs text-muted mt-2">
              Select a workshop to view registrations.
            </p>
          )}

          {selectedWorkshopId && (
            <>
              {selectedWorkshop && (
                <p className="text-xs font-semibold text-accent mb-3 mt-2 truncate">
                  {selectedWorkshop.title}
                </p>
              )}

              {regLoading && (
                <div className="space-y-2 mt-2">
                  <div className="animate-pulse bg-border rounded-lg h-16" />
                  <div className="animate-pulse bg-border rounded-lg h-8" />
                  <div className="animate-pulse bg-border rounded-lg h-8" />
                </div>
              )}

              {regError && (
                <p className="text-xs text-muted mt-2">Could not load registrations.</p>
              )}

              {regData && !regLoading && (
                <div className="mt-2 space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{regData.total}</p>
                    <p className="text-xs text-muted">Total Registrations</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'O-Level', value: regData.byLevel['O_LEVEL'] ?? 0 },
                      { label: 'A-Level', value: regData.byLevel['A_LEVEL'] ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-background rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-primary">{value}</p>
                        <p className="text-xs text-muted">{label}</p>
                      </div>
                    ))}
                  </div>

                  {topCombinations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                        Top Combinations
                      </p>
                      <div className="space-y-2">
                        {topCombinations.map(([combo, count]) => (
                          <div key={combo} className="flex items-center justify-between">
                            <span className="text-xs text-primary">{combo}</span>
                            <div className="bg-border rounded-full h-1 flex-1 mx-2">
                              <div
                                className="bg-accent rounded-full h-1"
                                style={{ width: `${(count / maxComboCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {topSchools.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                        Top Schools
                      </p>
                      <div className="space-y-2">
                        {topSchools.map(([school, count]) => (
                          <div key={school} className="flex items-center justify-between">
                            <span className="text-xs text-primary truncate mr-2">{school}</span>
                            <span className="text-xs text-muted flex-shrink-0">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <CreateWorkshopModal
          onClose={() => { setShowModal(false); setEditWorkshop(null) }}
          onSuccess={refetch}
          editWorkshop={editWorkshop}
        />
      )}
    </div>
  )
}

export default CompanyWorkshops
