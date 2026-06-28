import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { MapPin, Monitor, Users, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useCompanyWorkshops from '@/hooks/useCompanyWorkshops'
import CreateWorkshopModal from '@/components/company/CreateWorkshopModal'
import { getSectorStyle } from '@/utils/sectorColors'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import type { CompanyWorkshop } from '@/hooks/useCompanyWorkshops'

type Tab = 'Active' | 'Archived' | 'Drafts'

interface RegistrationData {
  total: number
  byLevel: Record<string, number>
  byCombination: Record<string, number>
  bySchool: Record<string, number>
}

const CompanyWorkshops = () => {
  const { user } = useAuth()
  const { workshops, loading, refetch } = useCompanyWorkshops()
  const [tab, setTab] = useState<Tab>('Active')
  const [showModal, setShowModal] = useState(false)
  const [editWorkshop, setEditWorkshop] = useState<CompanyWorkshop | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [regData, setRegData] = useState<Record<string, RegistrationData>>({})
  const [regLoading, setRegLoading] = useState<Record<string, boolean>>({})
  const [regError, setRegError] = useState<Record<string, boolean>>({})

  if (user?.company?.isVerified === false) {
    return <Navigate to="/company/home" replace />
  }

  const now = new Date()

  const filtered = workshops.filter((w) => {
    if (tab === 'Drafts') return !w.isPublished
    if (tab === 'Active') return w.isPublished && new Date(w.date) > now
    return w.isPublished && new Date(w.date) <= now
  })

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (regData[id] || regLoading[id]) return
    setRegLoading((s) => ({ ...s, [id]: true }))
    try {
      const { data } = await api.get(`/workshops/${id}/registrations`)
      setRegData((s) => ({ ...s, [id]: data.data }))
    } catch {
      setRegError((s) => ({ ...s, [id]: true }))
    } finally {
      setRegLoading((s) => ({ ...s, [id]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this workshop?')) return
    try {
      await api.delete(`/workshops/${id}`)
      refetch()
      toast.success('Workshop deleted.')
    } catch {
      toast.error('Could not delete workshop.')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/workshops/${id}/publish`)
      refetch()
      toast.success('Workshop published.')
    } catch {
      toast.error('Could not save workshop. Please try again.')
    }
  }

  const openEdit = (w: CompanyWorkshop) => {
    setEditWorkshop(w)
    setShowModal(true)
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Workshop Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Manage your upcoming and past career workshops.
          </p>
        </div>
        <button
          onClick={() => { setEditWorkshop(null); setShowModal(true) }}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors self-start"
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

      {/* Workshop list */}
      <div className="space-y-4 mt-6">
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
            const isExpanded = expandedId === w.id
            const rd = regData[w.id]
            const topCombinations = rd
              ? Object.entries(rd.byCombination).sort((a, b) => b[1] - a[1])
              : []
            const maxComboCount = topCombinations[0]?.[1] ?? 1

            return (
              <div key={w.id}>
                <div className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
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
                          ? 'bg-border text-muted'
                          : 'bg-border text-muted',
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
                      <>
                        <button
                          onClick={() => handleExpand(w.id)}
                          className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-background"
                        >
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                        {tab === 'Active' && (
                          <button
                            onClick={() => openEdit(w)}
                            className="border border-border text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-background transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Expandable detail panel */}
                {isExpanded && (
                  <div className="bg-background border border-border rounded-xl p-5 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wide">Description</p>
                        <p className="text-primary mt-1">{w.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide">Date</p>
                          <p className="text-primary">
                            {w.date ? new Date(w.date).toLocaleDateString('en-US', {
                              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                            }) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide">Format</p>
                          <p className="text-primary">{w.format === 'IN_PERSON' ? 'In Person' : 'Online'}</p>
                        </div>
                        {w.format === 'IN_PERSON' && w.location && (
                          <div>
                            <p className="text-xs text-muted uppercase tracking-wide">Location</p>
                            <p className="text-primary">{w.location}</p>
                          </div>
                        )}
                        {w.format === 'ONLINE' && w.meetingLink && (
                          <div>
                            <p className="text-xs text-muted uppercase tracking-wide">Join Link</p>
                            <a href={w.meetingLink} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs">
                              {w.meetingLink}
                            </a>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted uppercase tracking-wide">Capacity</p>
                          <p className="text-primary">{w.capacity} students</p>
                        </div>
                      </div>
                    </div>

                    {regLoading[w.id] && (
                      <div className="space-y-2">
                        <div className="animate-pulse bg-border rounded h-8" />
                        <div className="animate-pulse bg-border rounded h-8" />
                      </div>
                    )}

                    {regError[w.id] && (
                      <p className="text-xs text-muted">Could not load registration breakdown.</p>
                    )}

                    {rd && !regLoading[w.id] && (
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex gap-4">
                          <div className="bg-surface rounded-xl px-4 py-2 text-center">
                            <p className="text-lg font-bold text-primary">{rd.total}</p>
                            <p className="text-xs text-muted">Total</p>
                          </div>
                          <div className="bg-surface rounded-xl px-4 py-2 text-center">
                            <p className="text-lg font-bold text-primary">{rd.byLevel['O_LEVEL'] ?? 0}</p>
                            <p className="text-xs text-muted">O-Level</p>
                          </div>
                          <div className="bg-surface rounded-xl px-4 py-2 text-center">
                            <p className="text-lg font-bold text-primary">{rd.byLevel['A_LEVEL'] ?? 0}</p>
                            <p className="text-xs text-muted">A-Level</p>
                          </div>
                        </div>

                        {topCombinations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Top Combinations</p>
                            <div className="space-y-1.5">
                              {topCombinations.slice(0, 4).map(([combo, count]) => (
                                <div key={combo} className="flex items-center gap-2">
                                  <span className="text-xs text-primary w-32 truncate">{combo}</span>
                                  <div className="bg-border rounded-full h-1 flex-1">
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
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-muted hover:text-primary mt-4 block"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
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
