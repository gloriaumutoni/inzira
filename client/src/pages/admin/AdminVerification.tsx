import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import useVerification, { PendingProfessional } from '@/hooks/useVerification'
import useMentorApplications, { MentorApplication } from '@/hooks/useMentorApplications'
import useCareerGuideVerification, { PendingCareerGuide } from '@/hooks/useCareerGuideVerification'

const AdminVerification = () => {
  const { professionals, loading, error, refetch } = useVerification()
  const { applications, loading: mentorLoading, error: mentorError, refetch: refetchMentors } = useMentorApplications()
  const { careerGuides, loading: cgLoading, error: cgError, refetch: refetchCG } = useCareerGuideVerification()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<PendingProfessional | null>(null)
  const [activeTab, setActiveTab] = useState<'professionals' | 'mentors' | 'careerGuides'>('professionals')
  const [selectedApplication, setSelectedApplication] = useState<MentorApplication | null>(null)
  const [mentorActioningId, setMentorActioningId] = useState<string | null>(null)
  const [selectedCareerGuide, setSelectedCareerGuide] = useState<PendingCareerGuide | null>(null)
  const [cgActioningId, setCgActioningId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setActioningId(id)
    try {
      await api.patch(`/admin/verification/professionals/${id}/approve`)
      toast.success('Professional approved. They will receive a confirmation email.')
      setSelectedProfessional(null)
      refetch()
    } catch {
      toast.error('Could not approve. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const handleDecline = async (id: string) => {
    setActioningId(id)
    try {
      await api.patch(`/admin/verification/professionals/${id}/reject`)
      toast.success('Professional declined.')
      setSelectedProfessional(null)
      refetch()
    } catch {
      toast.error('Could not decline. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const handleApproveMentor = async (id: string) => {
    setMentorActioningId(id)
    try {
      await api.patch(`/admin/verification/mentors/${id}/approve`)
      toast.success('Mentor application approved.')
      setSelectedApplication(null)
      refetchMentors()
    } catch {
      toast.error('Could not approve. Please try again.')
    } finally {
      setMentorActioningId(null)
    }
  }

  const handleDeclineMentor = async (id: string) => {
    setMentorActioningId(id)
    try {
      await api.patch(`/admin/verification/mentors/${id}/reject`)
      toast.success('Mentor application declined.')
      setSelectedApplication(null)
      refetchMentors()
    } catch {
      toast.error('Could not decline. Please try again.')
    } finally {
      setMentorActioningId(null)
    }
  }

  const handleApproveCG = async (id: string) => {
    setCgActioningId(id)
    try {
      await api.patch(`/admin/verification/career-guides/${id}/approve`)
      toast.success('Career guide approved. They will receive a confirmation email.')
      setSelectedCareerGuide(null)
      refetchCG()
    } catch {
      toast.error('Could not approve. Please try again.')
    } finally {
      setCgActioningId(null)
    }
  }

  const handleDeclineCG = async (id: string) => {
    setCgActioningId(id)
    try {
      await api.patch(`/admin/verification/career-guides/${id}/reject`)
      toast.success('Career guide declined.')
      setSelectedCareerGuide(null)
      refetchCG()
    } catch {
      toast.error('Could not decline. Please try again.')
    } finally {
      setCgActioningId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Verification Queue</h1>
        <p className="text-sm text-muted mt-0.5">Review and approve pending professional applications</p>
      </div>

      <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
        {(['professionals', 'mentors', 'careerGuides'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? 'bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors'
                : 'text-muted text-sm font-medium px-4 py-1.5 rounded-lg hover:text-primary transition-colors'
            }
          >
            {tab === 'professionals' ? 'Professionals' : tab === 'mentors' ? 'Mentor Applications' : 'Career Guides'}
          </button>
        ))}
      </div>

      {activeTab === 'professionals' && (
        <>
          <div className="bg-surface rounded-xl border border-border p-4 inline-flex flex-col items-center min-w-[140px]">
            <p className="text-2xl font-bold text-primary">
              {loading ? '—' : professionals.length}
            </p>
            <p className="text-xs text-muted uppercase tracking-wide mt-1">Pending</p>
          </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-48" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
          <p className="text-sm text-error">Unable to load verification queue. Please refresh.</p>
        </div>
      ) : professionals.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted">No professionals pending verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {professionals.map((pro) => (
            <div key={pro.id} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {pro.firstName} {pro.lastName}
                  </p>
                  <p className="text-xs text-muted">{pro.email}</p>
                </div>
                <span className="bg-warning/10 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
                  Pending
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xs text-muted">Job Title</p>
                  <p className="text-sm text-primary">{pro.jobTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Employer</p>
                  <p className="text-sm text-primary">{pro.employer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Sector</p>
                  <p className="text-sm text-primary">{pro.sector}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Submitted</p>
                  <p className="text-sm text-primary">
                    {new Date(pro.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-muted">Bio</p>
                <p className="text-sm text-primary mt-1">{pro.bio}</p>
              </div>

              <div className="mt-3">
                {pro.linkedinUrl ? (
                  <a
                    href={pro.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline flex items-center gap-1 w-fit"
                  >
                    View LinkedIn Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-error">No LinkedIn profile submitted</p>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setSelectedProfessional(pro)}
                  className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProfessional && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSelectedProfessional(null)}
          />
          <div className="relative bg-surface w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-primary">Review Professional</h2>
              <button
                onClick={() => setSelectedProfessional(null)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-base font-semibold text-primary">
                  {selectedProfessional.firstName} {selectedProfessional.lastName}
                </p>
                <p className="text-sm text-muted">{selectedProfessional.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted">Job Title</p>
                  <p className="text-sm text-primary">{selectedProfessional.jobTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Employer</p>
                  <p className="text-sm text-primary">{selectedProfessional.employer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Sector</p>
                  <p className="text-sm text-primary">{selectedProfessional.sector}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Submitted</p>
                  <p className="text-sm text-primary">
                    {new Date(selectedProfessional.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted">Bio</p>
                <p className="text-sm text-primary mt-1">{selectedProfessional.bio}</p>
              </div>

              <div>
                {selectedProfessional.linkedinUrl ? (
                  <a
                    href={selectedProfessional.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline flex items-center gap-1 w-fit"
                  >
                    View LinkedIn Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-error">No LinkedIn profile submitted</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setSelectedProfessional(null)}
                className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
              >
                Back to list
              </button>
              <button
                onClick={() => handleDecline(selectedProfessional.id)}
                disabled={actioningId === selectedProfessional.id}
                className="flex-1 border border-error text-error py-2.5 rounded-lg text-sm font-semibold hover:bg-error/5 disabled:opacity-60 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => handleApprove(selectedProfessional.id)}
                disabled={actioningId === selectedProfessional.id}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}

      {activeTab === 'mentors' && (
        <>
          <div className="bg-surface rounded-xl border border-border p-4 inline-flex flex-col items-center min-w-[140px]">
            <p className="text-2xl font-bold text-primary">
              {mentorLoading ? '—' : applications.length}
            </p>
            <p className="text-xs text-muted uppercase tracking-wide mt-1">Pending</p>
          </div>

          {mentorLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-border rounded-xl h-32" />
              ))}
            </div>
          ) : mentorError ? (
            <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
              <p className="text-sm text-error">Unable to load mentor applications. Please refresh.</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sm text-muted">No mentor applications pending.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-surface rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-muted">{app.email}</p>
                    </div>
                    <span className="bg-warning/10 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedApplication(app)}
                      className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedApplication && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedApplication(null)} />
              <div className="relative bg-surface w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-primary">Review Mentor Application</h2>
                  <button onClick={() => setSelectedApplication(null)} className="text-muted hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-primary">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                    <p className="text-sm text-muted">{selectedApplication.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted">Job Title</p>
                      <p className="text-sm text-primary">{selectedApplication.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Employer</p>
                      <p className="text-sm text-primary">{selectedApplication.employer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Sector</p>
                      <p className="text-sm text-primary">{selectedApplication.sector}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Applied</p>
                      <p className="text-sm text-primary">
                        {selectedApplication.appliedAt ? new Date(selectedApplication.appliedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  {selectedApplication.mentorBio && (
                    <div>
                      <p className="text-xs text-muted">Why they want to mentor</p>
                      <p className="text-sm text-primary mt-1">{selectedApplication.mentorBio}</p>
                    </div>
                  )}

                  <div>
                    {selectedApplication.linkedinUrl ? (
                      <a
                        href={selectedApplication.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline flex items-center gap-1 w-fit"
                      >
                        View LinkedIn Profile
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs text-error">No LinkedIn profile on file</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
                  >
                    Back to list
                  </button>
                  <button
                    onClick={() => handleDeclineMentor(selectedApplication.id)}
                    disabled={mentorActioningId === selectedApplication.id}
                    className="flex-1 border border-error text-error py-2.5 rounded-lg text-sm font-semibold hover:bg-error/5 disabled:opacity-60 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApproveMentor(selectedApplication.id)}
                    disabled={mentorActioningId === selectedApplication.id}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'careerGuides' && (
        <>
          <div className="bg-surface rounded-xl border border-border p-4 inline-flex flex-col items-center min-w-[140px]">
            <p className="text-2xl font-bold text-primary">
              {cgLoading ? '—' : careerGuides.length}
            </p>
            <p className="text-xs text-muted uppercase tracking-wide mt-1">Pending</p>
          </div>

          {cgLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-border rounded-xl h-32" />
              ))}
            </div>
          ) : cgError ? (
            <div className="bg-error/10 border border-error/20 rounded-xl p-6 text-center">
              <p className="text-sm text-error">Unable to load career guide queue. Please refresh.</p>
            </div>
          ) : careerGuides.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-10 text-center">
              <p className="text-sm text-muted">No career guides pending verification.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {careerGuides.map((cg) => (
                <div key={cg.id} className="bg-surface rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-primary">{cg.firstName} {cg.lastName}</p>
                      <p className="text-xs text-muted">{cg.email}</p>
                    </div>
                    <span className="bg-warning/10 text-warning text-xs font-semibold px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-2">{cg.school}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedCareerGuide(cg)}
                      className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCareerGuide && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="fixed inset-0 bg-black/40" onClick={() => setSelectedCareerGuide(null)} />
              <div className="relative bg-surface w-full max-w-md h-full overflow-y-auto p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-primary">Review Career Guide</h2>
                  <button onClick={() => setSelectedCareerGuide(null)} className="text-muted hover:text-primary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-base font-semibold text-primary">{selectedCareerGuide.firstName} {selectedCareerGuide.lastName}</p>
                    <p className="text-sm text-muted">{selectedCareerGuide.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted">School</p>
                      <p className="text-sm text-primary">{selectedCareerGuide.school}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Submitted</p>
                      <p className="text-sm text-primary">
                        {new Date(selectedCareerGuide.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    {selectedCareerGuide.linkedinUrl ? (
                      <a
                        href={selectedCareerGuide.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline flex items-center gap-1 w-fit"
                      >
                        View LinkedIn Profile
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs text-error">No LinkedIn profile submitted</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setSelectedCareerGuide(null)}
                    className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
                  >
                    Back to list
                  </button>
                  <button
                    onClick={() => handleDeclineCG(selectedCareerGuide.id)}
                    disabled={cgActioningId === selectedCareerGuide.id}
                    className="flex-1 border border-error text-error py-2.5 rounded-lg text-sm font-semibold hover:bg-error/5 disabled:opacity-60 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApproveCG(selectedCareerGuide.id)}
                    disabled={cgActioningId === selectedCareerGuide.id}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminVerification
