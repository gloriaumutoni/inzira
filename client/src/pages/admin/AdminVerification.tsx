import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle, ExternalLink, UserCheck, Award, GraduationCap, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  useVerificationProfessionalsQuery,
  useMentorApplicationsQuery,
  useCareerGuideVerificationQuery,
  useAdminStatsQuery,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
  type VerificationType,
} from '@/hooks/queries/adminQueries'

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

const EmptyState = ({ label }: { label: string }) => (
  <div className="text-center py-16">
    <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
    <p className="text-sm font-semibold text-primary">All clear</p>
    <p className="text-xs text-muted mt-1">No pending {label} at the moment.</p>
  </div>
)

const SKELETON_KEYS = ['a', 'b', 'c'] as const

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {SKELETON_KEYS.map((k) => (
      <div key={k} className="animate-pulse bg-border rounded-xl h-64" />
    ))}
  </div>
)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
  loading: boolean
}

const StatCard = ({ icon, label, value, bg, loading }: StatCardProps) => (
  <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-primary">{loading ? '—' : value.toLocaleString()}</p>
      <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
    </div>
  </div>
)

const AdminVerification = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'professionals' | 'mentors' | 'careerGuides'>(
    ((location.state as { tab?: string })?.tab as 'professionals' | 'mentors' | 'careerGuides') ?? 'professionals'
  )
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [declineModal, setDeclineModal] = useState<{
    id: string
    type: VerificationType
  } | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const { data: professionals = [], isLoading: proLoading } = useVerificationProfessionalsQuery()
  const { data: mentorApps = [], isLoading: mentorLoading } = useMentorApplicationsQuery()
  const { data: careerGuides = [], isLoading: cgLoading } = useCareerGuideVerificationQuery()
  const { data: stats, isLoading: statsLoading } = useAdminStatsQuery()
  const approveMutation = useApproveVerificationMutation()
  const rejectMutation = useRejectVerificationMutation()

  const handleApprove = async (id: string, type: VerificationType) => {
    setActioningId(id)
    try {
      await approveMutation.mutateAsync({ type, id })
      toast.success('Approved successfully')
    } catch {
      toast.error('Action failed')
    } finally {
      setActioningId(null)
    }
  }

  const openDeclineModal = (id: string, type: VerificationType) => {
    setDeclineModal({ id, type })
    setDeclineReason('')
  }

  const confirmDecline = async () => {
    if (!declineModal) return
    const { id, type } = declineModal
    setActioningId(id)
    try {
      await rejectMutation.mutateAsync({
        type,
        id,
        reason: declineReason.trim() || 'Does not meet current requirements',
      })
      toast.success('Declined')
      setDeclineModal(null)
    } catch {
      toast.error('Action failed')
    } finally {
      setActioningId(null)
    }
  }

  const activeTabClass =
    'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap'
  const inactiveTabClass =
    'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm flex items-center gap-2 whitespace-nowrap'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary">Verification</h1>
        <p className="text-sm text-muted mt-1">
          Review and approve pending professional, mentor, and career guide applications.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-success" />}
          label="APPROVED PROFESSIONALS"
          value={stats?.approvedProfessionals ?? 0}
          bg="bg-success/10"
          loading={statsLoading}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-accent" />}
          label="APPROVED MENTORS"
          value={stats?.approvedMentors ?? 0}
          bg="bg-accent/10"
          loading={statsLoading}
        />
        <StatCard
          icon={<GraduationCap className="w-5 h-5 text-primary" />}
          label="APPROVED CAREER GUIDES"
          value={stats?.approvedCareerGuides ?? 0}
          bg="bg-primary/10"
          loading={statsLoading}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('professionals')}
          className={activeTab === 'professionals' ? activeTabClass : inactiveTabClass}
        >
          Professionals
          {professionals.length > 0 && (
            <span className="bg-warning/20 text-warning text-xs font-bold px-1.5 py-0.5 rounded-full">
              {professionals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={activeTab === 'mentors' ? activeTabClass : inactiveTabClass}
        >
          Mentors
          {mentorApps.length > 0 && (
            <span className="bg-warning/20 text-warning text-xs font-bold px-1.5 py-0.5 rounded-full">
              {mentorApps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('careerGuides')}
          className={activeTab === 'careerGuides' ? activeTabClass : inactiveTabClass}
        >
          Career Guides
          {careerGuides.length > 0 && (
            <span className="bg-warning/20 text-warning text-xs font-bold px-1.5 py-0.5 rounded-full">
              {careerGuides.length}
            </span>
          )}
        </button>
      </div>

      {/* Professionals tab */}
      {activeTab === 'professionals' && (
        <div className="space-y-4">
          {proLoading && <LoadingSkeleton />}
          {!proLoading && professionals.length === 0 && <EmptyState label="professionals" />}
          {!proLoading && professionals.length > 0 && professionals.map((p) => (
              <div key={p.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials(p.firstName, p.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary text-sm truncate">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-muted truncate">{p.email}</p>
                    </div>
                  </div>
                  <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    PENDING
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Job Title</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{p.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Employer</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{p.employer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Sector</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{p.sector}</p>
                  </div>
                </div>

                {p.linkedinUrl && (
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3"
                  >
                    <ExternalLink className="w-3 h-3" /> LinkedIn Profile
                  </a>
                )}

                {p.rejectionCount > 0 && (
                  <div className="mt-3 p-3 bg-error/5 border border-error/20 rounded-lg">
                    <p className="text-xs font-semibold text-error">
                      Previously declined {p.rejectionCount} time{p.rejectionCount === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      <span className="font-medium text-error/80">Reason: </span>
                      {p.rejectionReason ?? 'No reason provided'}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted">Submitted {formatDate(p.submittedAt)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDeclineModal(p.id, 'professionals')}
                      disabled={actioningId === p.id}
                      className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 disabled:opacity-60"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(p.id, 'professionals')}
                      disabled={actioningId === p.id}
                      className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                    >
                      {actioningId === p.id ? '…' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Mentors tab */}
      {activeTab === 'mentors' && (
        <div className="space-y-4">
          {mentorLoading && <LoadingSkeleton />}
          {!mentorLoading && mentorApps.length === 0 && <EmptyState label="mentor applications" />}
          {!mentorLoading && mentorApps.length > 0 && mentorApps.map((m) => (
              <div key={m.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials(m.firstName, m.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary text-sm truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-muted truncate">{m.email}</p>
                    </div>
                  </div>
                  <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    PENDING
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Job Title</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{m.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Employer</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{m.employer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">Sector</p>
                    <p className="text-sm text-primary font-medium mt-0.5">{m.sector}</p>
                  </div>
                </div>

                {m.mentorBio && (
                  <p className="text-sm text-muted mt-3 leading-relaxed line-clamp-3">{m.mentorBio}</p>
                )}

                {m.linkedinUrl && (
                  <a
                    href={m.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3"
                  >
                    <ExternalLink className="w-3 h-3" /> LinkedIn Profile
                  </a>
                )}

                {m.interview && (
                  <div className="mt-3 p-3 bg-accent/5 rounded-lg">
                    <p className="text-xs text-muted uppercase tracking-wide">Interview Scheduled</p>
                    <p className="text-sm text-primary font-medium mt-0.5">
                      {formatDate(m.interview.scheduledAt)}
                    </p>
                    {m.interview.meetLink && (
                      <a
                        href={m.interview.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Join meeting
                      </a>
                    )}
                  </div>
                )}

                {m.mentorRejectionCount > 0 && (
                  <div className="mt-3 p-3 bg-error/5 border border-error/20 rounded-lg">
                    <p className="text-xs font-semibold text-error">
                      Previously declined {m.mentorRejectionCount} time{m.mentorRejectionCount === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      <span className="font-medium text-error/80">Reason: </span>
                      {m.mentorRejectionReason ?? 'No reason provided'}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted">Applied {formatDate(m.appliedAt)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDeclineModal(m.id, 'mentors')}
                      disabled={actioningId === m.id}
                      className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 disabled:opacity-60"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(m.id, 'mentors')}
                      disabled={actioningId === m.id}
                      className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                    >
                      {actioningId === m.id ? '…' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Decline modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <dialog
            open
            aria-labelledby="decline-modal-title"
            className="static bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 m-0 border-0 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="decline-modal-title" className="text-base font-bold text-primary">Decline application</h2>
              <button onClick={() => setDeclineModal(null)} className="text-muted hover:text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              Provide a reason so the applicant understands the decision.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="E.g. Missing LinkedIn profile, incomplete bio…"
              rows={4}
              autoFocus
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-error/30 bg-background text-primary"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setDeclineModal(null)}
                className="px-4 py-2 text-sm text-muted hover:text-primary border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={!!actioningId || !declineReason.trim()}
                className="px-4 py-2 text-sm bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-60"
              >
                {actioningId ? '…' : 'Confirm decline'}
              </button>
            </div>
          </dialog>
        </div>
      )}

      {/* Career Guides tab */}
      {activeTab === 'careerGuides' && (
        <div className="space-y-4">
          {cgLoading && <LoadingSkeleton />}
          {!cgLoading && careerGuides.length === 0 && <EmptyState label="career guide applications" />}
          {!cgLoading && careerGuides.length > 0 && careerGuides.map((cg) => (
              <div key={cg.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials(cg.firstName, cg.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary text-sm truncate">
                        {cg.firstName} {cg.lastName}
                      </p>
                      <p className="text-xs text-muted truncate">{cg.email}</p>
                    </div>
                  </div>
                  <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    PENDING
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-muted uppercase tracking-wide">School</p>
                  <p className="text-sm text-primary font-medium mt-0.5">{cg.school ?? '—'}</p>
                </div>

                {cg.linkedinUrl && (
                  <a
                    href={cg.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3"
                  >
                    <ExternalLink className="w-3 h-3" /> LinkedIn Profile
                  </a>
                )}

                {cg.rejectionCount > 0 && (
                  <div className="mt-3 p-3 bg-error/5 border border-error/20 rounded-lg">
                    <p className="text-xs font-semibold text-error">
                      Previously declined {cg.rejectionCount} time{cg.rejectionCount === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      <span className="font-medium text-error/80">Reason: </span>
                      {cg.rejectionReason ?? 'No reason provided'}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted">Submitted {formatDate(cg.submittedAt)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDeclineModal(cg.id, 'career-guides')}
                      disabled={actioningId === cg.id}
                      className="border border-error text-error text-xs px-3 py-1.5 rounded-lg hover:bg-error/5 disabled:opacity-60"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleApprove(cg.id, 'career-guides')}
                      disabled={actioningId === cg.id}
                      className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-60"
                    >
                      {actioningId === cg.id ? '…' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default AdminVerification
