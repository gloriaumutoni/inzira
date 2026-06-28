import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Eye, EyeOff, Trash2, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import useCompanyDashboard from '@/hooks/useCompanyDashboard'
import useCompanyWorkshops from '@/hooks/useCompanyWorkshops'
import CreateWorkshopModal from '@/components/company/CreateWorkshopModal'
import { getSectorStyle } from '@/utils/sectorColors'
import { api } from '@/api/axios'
import type { CompanyWorkshop } from '@/hooks/useCompanyWorkshops'

const CompanyHome = () => {
  const { user } = useAuth()
  const { stats, loading: statsLoading } = useCompanyDashboard()
  const { workshops, loading: wsLoading, refetch } = useCompanyWorkshops()
  const [showModal, setShowModal] = useState(false)
  const [editWorkshop, setEditWorkshop] = useState<CompanyWorkshop | null>(null)

  const companyName = user?.company?.companyName ?? 'Company'
  const isVerified = user?.company?.isVerified ?? false

  const recentWorkshops = [...workshops]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const now = new Date()
  const topByReg = [...workshops]
    .sort((a, b) => b.registrationCount - a.registrationCount)
    .slice(0, 2)

  const upcoming = [...workshops]
    .filter((w) => w.isPublished && new Date(w.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2)

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this workshop?')) return
    try {
      await api.delete(`/workshops/${id}`)
      refetch()
    } catch {
      // noop
    }
  }

  const handlePublishToggle = async (w: CompanyWorkshop) => {
    if (w.isPublished) return
    try {
      await api.patch(`/workshops/${w.id}/publish`)
      refetch()
    } catch {
      // noop
    }
  }

  const openEdit = (w: CompanyWorkshop) => {
    setEditWorkshop(w)
    setShowModal(true)
  }

  const openCreate = () => {
    setEditWorkshop(null)
    setShowModal(true)
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="bg-surface rounded-2xl border border-border p-10 max-w-lg w-full text-center shadow-sm">
          <Clock className="text-warning w-12 h-12 mx-auto" />
          <h2 className="text-xl font-bold text-primary mt-4">Your account is under review</h2>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Our team is verifying your company details. This usually takes 1–2 business days.
            You'll receive an email at{' '}
            <span className="font-medium text-primary">{user?.email}</span> once your account
            is approved.
          </p>
          <p className="text-xs text-subtle mt-6">
            Once approved, you'll be able to create workshops and connect with students across Kigali.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Welcome, {companyName}</h1>
          <p className="text-sm text-muted mt-1">
            Here is a snapshot of your current mentorship impact today.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors self-start"
        >
          Create Workshop
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
            <div className="animate-pulse bg-border rounded-xl h-24" />
          </>
        ) : (
          <>
            {[
              { value: stats?.workshopsPublished ?? 0, label: 'WORKSHOPS PUBLISHED' },
              { value: stats?.totalRegistrations ?? 0, label: 'TOTAL REGISTRATIONS' },
              { value: stats?.upcomingWorkshops ?? 0, label: 'UPCOMING WORKSHOPS' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Manage Workshops */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">Manage Workshops</h2>
            <button
              onClick={openCreate}
              className="text-sm text-accent hover:underline"
            >
              Add new
            </button>
          </div>

          <div className="space-y-3 mt-4">
            {wsLoading ? (
              <>
                <div className="animate-pulse bg-border rounded-xl h-28" />
                <div className="animate-pulse bg-border rounded-xl h-28" />
                <div className="animate-pulse bg-border rounded-xl h-28" />
              </>
            ) : recentWorkshops.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">No workshops yet.</p>
            ) : (
              recentWorkshops.map((w) => {
                const style = getSectorStyle(w.sector)
                return (
                  <div
                    key={w.id}
                    className="rounded-xl p-4 text-white flex items-start justify-between"
                    style={{ backgroundColor: style.bg }}
                  >
                    <div className="flex-1 min-w-0">
                      <span
                        className={[
                          'inline-block text-xs px-2 py-0.5 rounded-full',
                          w.isPublished
                            ? 'bg-success/10 text-success'
                            : 'bg-border text-muted',
                        ].join(' ')}
                      >
                        {w.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <p className="text-sm font-bold text-white mt-2 truncate">{w.title}</p>
                      <p className="text-xs text-white/70 mt-1 line-clamp-2">{w.description}</p>
                      <p className="text-xs text-white/60 mt-2">
                        {w.registrationCount} Registrations ·{' '}
                        {w.date ? new Date(w.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3 flex-shrink-0">
                      <button
                        onClick={() => openEdit(w)}
                        className="text-white/70 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handlePublishToggle(w)}
                        className="text-white/70 hover:text-white transition-colors"
                        title={w.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {w.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-white/70 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Link
            to="/company/workshops"
            className="inline-block text-sm text-accent hover:underline mt-4"
          >
            View Full Calendar
          </Link>
        </div>

        {/* Right — Your reach so far */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Your reach so far</h2>

          <div className="space-y-4 mt-4">
            {topByReg.map((w) => (
              <div key={w.id}>
                <p className="text-xs font-semibold text-primary truncate">{w.title}</p>
                <div className="bg-border rounded-full h-1.5 mt-1">
                  <div
                    className="bg-accent rounded-full h-1.5"
                    style={{
                      width: w.capacity > 0
                        ? `${Math.min((w.registrationCount / w.capacity) * 100, 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  {w.registrationCount} / {w.capacity} registrations
                </p>
              </div>
            ))}
          </div>

          {upcoming.length > 0 && (
            <>
              <hr className="border-border my-4" />
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Coming up</p>
              <div className="space-y-3 mt-3">
                {upcoming.map((w) => (
                  <div key={w.id}>
                    <p className="text-xs font-semibold text-accent">
                      {new Date(w.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-primary">{w.title}</p>
                  </div>
                ))}
              </div>
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

export default CompanyHome
