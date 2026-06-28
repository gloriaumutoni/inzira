import { useState } from 'react'
import { UserCheck, Building2, Globe, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useVerification from '@/hooks/useVerification'

const PAGE_SIZE = 10

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AdminVerification = () => {
  const { professionals, companies, loading, error, refetch } = useVerification()
  const [activeTab, setActiveTab] = useState<'professionals' | 'companies'>('professionals')
  const [sectorFilter, setSectorFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null)

  const handleApprove = async (id: string, isProfessional: boolean) => {
    setProcessing(id)
    setRowError(null)
    try {
      const path = isProfessional
        ? `/admin/verification/professionals/${id}/approve`
        : `/admin/verification/companies/${id}/approve`
      await api.patch(path)
      refetch()
      toast.success(
        isProfessional
          ? 'Professional approved. They will receive an email notification.'
          : 'Company approved. They will receive an email notification.',
      )
    } catch {
      setRowError(id)
      toast.error('Action failed. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string, isProfessional: boolean) => {
    const reason = window.prompt('Reason for rejection (optional):')
    if (reason === null) return
    setProcessing(id)
    setRowError(null)
    try {
      const path = isProfessional
        ? `/admin/verification/professionals/${id}/reject`
        : `/admin/verification/companies/${id}/reject`
      await api.patch(path, { reason: reason || 'Does not meet current requirements' })
      refetch()
      toast.success(isProfessional ? 'Professional declined.' : 'Company declined.')
    } catch {
      setRowError(id)
      toast.error('Action failed. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const proSectors = Array.from(new Set(professionals.map((p) => p.sector)))
  const compSectors = Array.from(new Set(companies.map((c) => c.sector)))

  const filteredPros = professionals
    .filter((p) => !sectorFilter || p.sector === sectorFilter)
    .filter(
      (p) =>
        !nameFilter ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(nameFilter.toLowerCase()) ||
        p.email.toLowerCase().includes(nameFilter.toLowerCase()),
    )

  const filteredComps = companies
    .filter((c) => !sectorFilter || c.sector === sectorFilter)
    .filter(
      (c) =>
        !nameFilter ||
        c.companyName.toLowerCase().includes(nameFilter.toLowerCase()) ||
        c.email.toLowerCase().includes(nameFilter.toLowerCase()),
    )

  const list = activeTab === 'professionals' ? filteredPros : filteredComps
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const sectorOptions = activeTab === 'professionals' ? proSectors : compSectors

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-primary">Verification</h1>
        {(professionals.length + companies.length) > 0 && (
          <span className="bg-warning/10 text-warning text-xs font-bold px-2 py-0.5 rounded-full">
            {professionals.length + companies.length} pending
          </span>
        )}
      </div>
      <p className="text-sm text-muted mt-1">Review and approve new professional and company accounts.</p>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            Icon: UserCheck,
            bg: 'bg-accent/10',
            color: 'text-accent',
            label: 'Professionals Pending',
            value: professionals.length,
          },
          {
            Icon: Building2,
            bg: 'bg-warning/10',
            color: 'text-warning',
            label: 'Companies Pending',
            value: companies.length,
          },
          {
            Icon: Globe,
            bg: 'bg-success/10',
            color: 'text-success',
            label: 'Total Approved',
            value: '—',
          },
        ].map(({ Icon, bg, color, label, value }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-5 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{loading ? '—' : value}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['professionals', 'companies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); setSectorFilter(''); setNameFilter('') }}
            className={
              activeTab === tab
                ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
                : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm'
            }
          >
            {tab === 'professionals' ? 'Professionals' : 'Companies'}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 items-start sm:items-center">
        <select
          value={sectorFilter}
          onChange={(e) => { setSectorFilter(e.target.value); setPage(1) }}
          className="border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">All Sectors</option>
          {sectorOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={nameFilter}
          onChange={(e) => { setNameFilter(e.target.value); setPage(1) }}
          className="border border-border rounded-lg px-3 py-2 text-sm w-full sm:w-64 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <span className="text-sm text-muted sm:ml-auto">
          Showing {list.length} {activeTab === 'professionals' ? 'professional' : 'company'}{list.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mt-4">
        {loading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-border h-14 mx-5 my-2 rounded" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted p-5">Unable to load verification queue.</p>
        ) : paginated.length === 0 ? (
          <p className="text-sm text-muted p-5">
            No pending {activeTab === 'professionals' ? 'professionals' : 'companies'} to review.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background border-b border-border">
                  {activeTab === 'professionals'
                    ? ['Name', 'Sector', 'Submitted', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-muted uppercase px-5 py-3">{h}</th>
                      ))
                    : ['Company', 'Contact', 'Sector', 'Submitted', ''].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-muted uppercase px-5 py-3">{h}</th>
                      ))
                  }
                </tr>
              </thead>
              <tbody>
                {activeTab === 'professionals'
                  ? (paginated as typeof filteredPros).map((p) => (
                      <tr key={p.id} className="border-b border-border hover:bg-background transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {initials(`${p.firstName} ${p.lastName}`)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-primary">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-xs text-muted">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted">{p.sector}</td>
                        <td className="px-5 py-3 text-xs text-muted">{formatDate(p.submittedAt)}</td>
                        <td className="px-5 py-3">
                          <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full font-semibold">
                            PENDING
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => handleReject(p.id, true)}
                              disabled={processing === p.id}
                              className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 disabled:opacity-60"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApprove(p.id, true)}
                              disabled={processing === p.id}
                              className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                            >
                              {processing === p.id ? '…' : 'Accept'}
                            </button>
                            {rowError === p.id && (
                              <span className="text-error text-xs">Failed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  : (paginated as typeof filteredComps).map((c) => (
                      <>
                        <tr
                          key={c.id}
                          className="border-b border-border hover:bg-background transition-colors cursor-pointer"
                          onClick={() => setExpandedCompanyId(expandedCompanyId === c.id ? null : c.id)}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {initials(c.companyName)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-primary">{c.companyName}</p>
                                <p className="text-xs text-muted">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-medium text-primary">{(c as { contactPerson?: string }).contactPerson ?? '—'}</p>
                            <p className="text-xs text-muted">{(c as { contactPhone?: string }).contactPhone ?? ''}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
                              {c.sector}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted">{formatDate(c.submittedAt)}</td>
                          <td className="px-5 py-3">
                            <button className="text-muted hover:text-primary transition-colors">
                              {expandedCompanyId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                        </tr>
                        {expandedCompanyId === c.id && (
                          <tr key={`${c.id}-expanded`} className="border-b border-border">
                            <td colSpan={5} className="bg-background border-t border-border px-5 py-4">
                              {(c as { description?: string }).description && (
                                <p className="text-sm text-muted mb-3">{(c as { description?: string }).description}</p>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                                <div>
                                  <p className="text-subtle uppercase tracking-wide">Contact Person</p>
                                  <p className="text-primary font-medium mt-0.5">{(c as { contactPerson?: string }).contactPerson ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-subtle uppercase tracking-wide">Phone</p>
                                  <p className="text-primary font-medium mt-0.5">{(c as { contactPhone?: string }).contactPhone ?? '—'}</p>
                                </div>
                                <div>
                                  <p className="text-subtle uppercase tracking-wide">Email</p>
                                  <p className="text-primary font-medium mt-0.5">{c.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReject(c.id, false)}
                                  disabled={processing === c.id}
                                  className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 disabled:opacity-60"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleApprove(c.id, false)}
                                  disabled={processing === c.id}
                                  className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                                >
                                  {processing === c.id ? '…' : 'Approve'}
                                </button>
                                {rowError === c.id && (
                                  <span className="text-error text-xs self-center">Failed</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTab === 'companies' && (
        <p className="text-xs text-muted italic mt-3">
          Tip: Search the company name online before approving. Verify their sector matches their website.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-4 justify-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1 rounded text-muted hover:text-primary disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                n === safePage
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1 rounded text-muted hover:text-primary disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminVerification
