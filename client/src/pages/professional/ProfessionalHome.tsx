import { useState } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import MentorApplicationSection from '@/components/professional/MentorApplicationSection'
import CreateGroupSessionModal from '@/components/professional/CreateGroupSessionModal'
import { CareerStoryForm, EMPTY_FORM } from '@/components/professional/CareerStoryForm'
import {
  professionalDashboardKeys,
  useGroupSessionsMeQuery,
  useMenteeSessionsQuery,
  useCareerStoriesMeQuery,
  useCareerStoryCombinationsQuery,
} from '@/hooks/queries/professionalDashboardQueries'
import {
  createCareerStory,
  type CareerStoryPayload,
} from '@/api/careerStories.api'

const ProfessionalHome = () => {
  const { user } = useAuth()
  const isMentor = user?.professional?.isMentor ?? false
  const queryClient = useQueryClient()

  const { data: groupSessions = [], isLoading: gsLoading } = useGroupSessionsMeQuery()
  const { data: menteeSessions = [], isLoading: menteeLoading } = useMenteeSessionsQuery(isMentor)

  const now = new Date()
  const gsCompletedCount = groupSessions.filter(s => new Date(s.scheduledAt) < now).length
  const upcomingGroupSessions = groupSessions
    .filter(s => new Date(s.scheduledAt) > now && !s.isCancelled)
    .slice(0, 4)
  const gsUpcomingCount = groupSessions.filter(s => new Date(s.scheduledAt) > now && !s.isCancelled).length

  const oneOnOneCompletedCount = menteeSessions.filter(s => new Date(s.scheduledAt) < now).length
  const upcomingMenteeSessions = menteeSessions
    .filter(s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status))
    .slice(0, 4)
  const oneOnOneUpcomingCount = menteeSessions.filter(
    s => new Date(s.scheduledAt) > now && ['PENDING', 'CONFIRMED'].includes(s.status)
  ).length

  const { data: stories = [], isLoading: storiesLoading } = useCareerStoriesMeQuery()
  const [showStoryForm, setShowStoryForm] = useState(false)
  const { data: combinations = [] } = useCareerStoryCombinationsQuery(showStoryForm)
  const [storySubmitting, setStorySubmitting] = useState(false)
  const [storyFormError, setStoryFormError] = useState('')

  const [sessionTab, setSessionTab] = useState<'Group Sessions' | 'Mentor Sessions'>('Group Sessions')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateStory = async (data: CareerStoryPayload) => {
    setStorySubmitting(true)
    setStoryFormError('')
    try {
      await createCareerStory(data)
      setShowStoryForm(false)
      queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.careerStoriesMe })
    } catch (err) {
      setStoryFormError(err instanceof Error ? err.message : 'Failed to submit story')
    } finally {
      setStorySubmitting(false)
    }
  }

  if (user?.professional && !user.professional.isVerified) {
    const isRejected = user.professional.verificationStatus === 'REJECTED'

    return (
      <div className="p-6 space-y-6">
        {isRejected ? (
          <div className="bg-error/10 border border-error/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-error">Request to become Professional declined</p>
            {user.professional.rejectionReason && (
              <p className="text-xs text-muted mt-1">Reason: {user.professional.rejectionReason}</p>
            )}
          </div>
        ) : (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-primary">Your account is under review</p>
            <p className="text-xs text-muted mt-1">Our team is verifying your LinkedIn profile and background. You'll receive an email once approved.</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 opacity-40 pointer-events-none">
          {['GROUP SESSIONS COMPLETED', 'UPCOMING GROUP SESSIONS'].map(label => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-border">—</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sessionGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'

  const typeLabel = (type: string) => {
    if (type === 'FREE_INTRO') return 'Free Intro'
    if (type === 'PRO') return 'Pro'
    return 'Premium'
  }

  const renderGroupSessions = () => {
    if (gsLoading) return (
      <div className={sessionGridClass}>
        {[1, 2].map(i => <div key={i} className="animate-pulse bg-border rounded-xl h-24" />)}
      </div>
    )
    if (upcomingGroupSessions.length === 0) return <p className="text-sm text-muted">No upcoming group sessions.</p>
    return (
      <div className={sessionGridClass}>
        {upcomingGroupSessions.map(session => {
          const date = new Date(session.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const enrolled = session._count?.enrolments ?? 0
          return (
            <div key={session.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary truncate">{session.title}</p>
              <p className="text-xs text-muted">{date} · {time}</p>
              <p className="text-xs text-muted">{enrolled}/{session.maxStudents} enrolled</p>
              {session.joinLink && (
                <a href={session.joinLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-auto">Join →</a>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMenteeSessions = () => {
    if (menteeLoading) return (
      <div className={sessionGridClass}>
        {[1, 2].map(i => <div key={i} className="animate-pulse bg-border rounded-xl h-24" />)}
      </div>
    )
    if (upcomingMenteeSessions.length === 0) return <p className="text-sm text-muted">No upcoming mentee sessions.</p>
    return (
      <div className={sessionGridClass}>
        {upcomingMenteeSessions.map(session => {
          const date = new Date(session.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={session.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary">{session.student.firstName} {session.student.lastName}</p>
              <p className="text-xs text-muted">{date} · {time}</p>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full w-fit">{typeLabel(session.type)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Welcome back, {user?.professional?.firstName}</h1>
        <p className="text-sm text-muted mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isMentor ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <div className="bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{gsCompletedCount ?? '—'}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">GROUP SESSIONS COMPLETED</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-2xl font-bold text-primary">{gsUpcomingCount ?? '—'}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">UPCOMING GROUP SESSIONS</p>
        </div>
        {isMentor && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{oneOnOneCompletedCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">1-ON-1 SESSIONS COMPLETED</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-primary">{oneOnOneUpcomingCount ?? '—'}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">UPCOMING 1-ON-1 SESSIONS</p>
            </div>
          </>
        )}
      </div>

      {/* Sessions section with tabs (mentor) or plain (non-mentor) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {isMentor ? (
            <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
              {(['Group Sessions', 'Mentor Sessions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSessionTab(tab)}
                  className={sessionTab === tab
                    ? 'bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium'
                    : 'text-muted hover:text-primary px-4 py-1.5 rounded-lg text-sm transition-colors'
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <h2 className="text-base font-semibold text-primary">Upcoming Group Sessions</h2>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Session
          </button>
        </div>

        {(!isMentor || sessionTab === 'Group Sessions') && renderGroupSessions()}

        {isMentor && sessionTab === 'Mentor Sessions' && renderMenteeSessions()}
      </div>

      {user?.professional?.isVerified && !isMentor && (
        <MentorApplicationSection />
      )}

      {/* Career Story section */}
      <div>
        <h2 className="text-base font-semibold text-primary mb-4">Your Career Story</h2>

        {storiesLoading && (
          <div className="animate-pulse bg-border rounded-xl h-24" />
        )}

        {!storiesLoading && stories.length === 0 && !showStoryForm && (
          <div className="bg-surface border border-dashed border-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Share your career journey with students considering your field</p>
              <p className="text-xs text-muted mt-1">Your story helps A-Level students make informed decisions about their subject combinations.</p>
            </div>
            <button
              onClick={() => setShowStoryForm(true)}
              className="flex-shrink-0 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Write Story
            </button>
          </div>
        )}

        {!storiesLoading && showStoryForm && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-4">New career story</h3>
            <CareerStoryForm
              initialValues={EMPTY_FORM}
              combinations={combinations}
              onSubmit={handleCreateStory}
              onCancel={() => { setShowStoryForm(false); setStoryFormError('') }}
              submitLabel="Submit for review"
              loading={storySubmitting}
              error={storyFormError}
            />
          </div>
        )}

        {!storiesLoading && stories.length > 0 && !showStoryForm && (() => {
          const story = stories[0]
          const statusMeta = {
            PENDING_REVIEW: { icon: Clock,        color: 'text-warning', label: 'Pending Review' },
            PUBLISHED:      { icon: CheckCircle,  color: 'text-success', label: 'Published'      },
            REJECTED:       { icon: XCircle,      color: 'text-error',   label: 'Rejected'       },
            DRAFT:          { icon: Clock,        color: 'text-muted',   label: 'Draft'          },
          }[story.status]
          const Icon = statusMeta.icon
          return (
            <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">{story.jobTitle}</p>
                  <p className="text-xs text-muted mt-0.5">{story.sector}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusMeta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {statusMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {story.combinations.map((c: string) => (
                  <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>

              {story.status === 'REJECTED' && story.rejectionReason && (
                <div className="flex items-start gap-2 text-xs text-error bg-error/5 border border-error/20 rounded-lg p-3">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span><span className="font-medium">Rejection reason:</span> {story.rejectionReason}</span>
                </div>
              )}

              {story.status === 'PUBLISHED' && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">Preview</p>
                  <p className="text-xs text-foreground leading-relaxed line-clamp-3">{story.myPath}</p>
                </div>
              )}

              <a
                href="/professional/career-stories"
                className="inline-block text-xs text-accent hover:underline"
              >
                {story.status === 'REJECTED' ? 'Edit & resubmit →' : 'View all stories →'}
              </a>
            </div>
          )
        })()}
      </div>

      {showCreateModal && (
        <CreateGroupSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.groupSessionsMe })
          }}
        />
      )}
    </div>
  )
}

export default ProfessionalHome
