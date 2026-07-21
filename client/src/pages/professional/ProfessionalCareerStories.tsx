import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createCareerStory,
  updateCareerStory,
  type CareerStory,
  type CareerStoryPayload,
} from '@/api/careerStories.api'
import { listCareers } from '@/api/careers.api'
import {
  professionalDashboardKeys,
  useCareerStoriesMeQuery,
  useCareerStoryCombinationsQuery,
} from '@/hooks/queries/professionalDashboardQueries'
import { CareerStoryForm, EMPTY_FORM, type CareerOption } from '@/components/professional/CareerStoryForm'
import { STREAM_MAP, type StreamCode } from '@/constants/streams'

type Status = CareerStory['status']

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
  DRAFT: { label: 'Draft', icon: ChevronDown, color: 'text-muted' },
  PENDING_REVIEW: { label: 'Pending Review', icon: Clock, color: 'text-warning' },
  PUBLISHED: { label: 'Published', icon: CheckCircle, color: 'text-success' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-error' },
}

function StatusBadge({ status }: Readonly<{ status: Status }>) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  )
}

function StoryCard({
  story,
  onEdit,
}: Readonly<{
  story: CareerStory
  onEdit: (story: CareerStory) => void
}>) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{story.jobTitle}</p>
          <p className="text-xs text-muted mt-0.5">{story.sector}</p>
        </div>
        <StatusBadge status={story.status} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {story.streamCodes.map(s => (
          <span key={s} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            {STREAM_MAP[s as StreamCode]?.name ?? s}
          </span>
        ))}
        {story.combinations.map(c => (
          <span key={c} className="text-xs bg-surface border border-border text-muted px-2 py-0.5 rounded-full">
            {c}
          </span>
        ))}
      </div>

      {story.status === 'REJECTED' && story.rejectionReason && (
        <div className="flex items-start gap-2 text-xs text-error bg-error/5 border border-error/20 rounded-lg p-3">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span><span className="font-medium">Rejection reason:</span> {story.rejectionReason}</span>
        </div>
      )}

      {expanded && (
        <div className="space-y-3 border-t border-border pt-4">
          <StorySection title="How I got here">{story.myPath}</StorySection>
          <StorySection title="What I do">{story.whatIDo}</StorySection>
          <StorySection title="Advice for students">{story.adviceForStudents}</StorySection>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide' : 'Preview'}
        </button>

        {(story.status === 'DRAFT' || story.status === 'REJECTED') && (
          <button
            onClick={() => onEdit(story)}
            className="text-xs text-accent hover:underline"
          >
            Edit & resubmit
          </button>
        )}
      </div>
    </div>
  )
}

function StorySection({ title, children }: Readonly<{ title: string; children: string }>) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{title}</p>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  )
}

const ProfessionalCareerStories = () => {
  const queryClient = useQueryClient()
  const { data: stories = [], isLoading: loading } = useCareerStoriesMeQuery()
  const { data: combinations = [] } = useCareerStoryCombinationsQuery()
  const [showForm, setShowForm] = useState(false)
  const [editingStory, setEditingStory] = useState<CareerStory | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([])

  useEffect(() => {
    listCareers({ limit: 200 })
      .then(res => setCareerOptions(res.careers.map(c => ({ id: c.id, title: c.title }))))
      .catch(() => {})
  }, [])

  const invalidateStories = () =>
    queryClient.invalidateQueries({ queryKey: professionalDashboardKeys.careerStoriesMe })

  const handleCreate = async (data: CareerStoryPayload) => {
    setSubmitting(true)
    setFormError('')
    try {
      await createCareerStory(data)
      invalidateStories()
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit story')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (data: CareerStoryPayload) => {
    if (!editingStory) return
    setSubmitting(true)
    setFormError('')
    try {
      await updateCareerStory(editingStory.id, data)
      invalidateStories()
      setEditingStory(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update story')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Career Stories</h1>
          <p className="text-sm text-muted mt-0.5">
            Share your path to inspire O-Level students choosing their combination
          </p>
        </div>
        {!showForm && !editingStory && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add story
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-primary mb-4">New career story</h2>
          <CareerStoryForm
            initialValues={EMPTY_FORM}
            combinations={combinations}
            careers={careerOptions}
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setFormError('') }}
            submitLabel="Submit for review"
            loading={submitting}
            error={formError}
          />
        </div>
      )}

      {editingStory && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-primary mb-4">Edit story</h2>
          <CareerStoryForm
            initialValues={{
              jobTitle: editingStory.jobTitle,
              sector: editingStory.sector,
              streamCodes: editingStory.streamCodes,
              combinations: editingStory.combinations,
              myPath: editingStory.myPath,
              whatIDo: editingStory.whatIDo,
              adviceForStudents: editingStory.adviceForStudents,
              universityStudied: editingStory.universityStudied ?? '',
              program: editingStory.program ?? '',
              entryRequirements: editingStory.entryRequirements ?? '',
              firstJobStep: editingStory.firstJobStep ?? '',
              yearsToGetThere: editingStory.yearsToGetThere ?? '',
              keySkills: editingStory.keySkills,
              linkedCareerId: editingStory.linkedCareerId ?? '',
            }}
            combinations={combinations}
            careers={careerOptions}
            onSubmit={handleEdit}
            onCancel={() => { setEditingStory(null); setFormError('') }}
            submitLabel="Resubmit for review"
            loading={submitting}
            error={formError}
          />
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-32" />
          ))}
        </div>
      )}

      {!loading && stories.length === 0 && !showForm && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted">You haven't submitted any career stories yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Share your story
          </button>
        </div>
      )}

      {!loading && stories.length > 0 && (
        <div className="space-y-4">
          {stories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onEdit={s => { setEditingStory(s); setShowForm(false); setFormError('') }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessionalCareerStories
