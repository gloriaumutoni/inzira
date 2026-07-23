import { useState } from 'react'
import { CheckCircle, XCircle, BookOpen, AlertCircle, EyeOff, PenLine, X, ChevronDown } from 'lucide-react'
import { type CareerStory } from '@/api/careerStories.api'
import {
  useAdminCareerStoriesQuery,
  useVerifiedProfessionalsQuery,
  useApproveCareerStoryMutation,
  useRejectCareerStoryMutation,
  useUnpublishCareerStoryMutation,
  useCreateCareerStoryMutation,
  type CareerStoryTab as Tab,
} from '@/hooks/queries/adminQueries'
import { CombinationPathwayPicker } from '@/components/shared/CombinationPathwayPicker'

const SECTORS = [
  'Technology', 'Healthcare', 'Engineering', 'Finance & Banking', 'Education',
  'Agriculture', 'Media & Communications', 'Law', 'Architecture', 'Business & Management',
  'Science & Research', 'Public Service', 'NGO & Development', 'Tourism & Hospitality', 'Other',
]

const EMPTY_FORM = {
  professionalId: '',
  jobTitle: '',
  sector: '',
  combinations: [] as string[],
  myPath: '',
  whatIDo: '',
  adviceForStudents: '',
}

function WriteStoryModal({
  onClose,
  onSubmit,
  submitting,
}: Readonly<{
  onClose: () => void
  onSubmit: (data: typeof EMPTY_FORM) => Promise<void>
  submitting: boolean
}>) {
  const [form, setForm] = useState(EMPTY_FORM)
  const { data: professionals = [] } = useVerifiedProfessionalsQuery()
  const [proSearch, setProSearch] = useState('')
  const [proDropOpen, setProDropOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const selectedPro = professionals.find(p => p.id === form.professionalId)
  const filteredPros = professionals.filter(p =>
    `${p.firstName} ${p.lastName} ${p.jobTitle}`.toLowerCase().includes(proSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.professionalId) { setFormError('Select a professional'); return }
    if (!form.jobTitle.trim()) { setFormError('Job title is required'); return }
    if (!form.sector) { setFormError('Sector is required'); return }
    if (form.combinations.length === 0) { setFormError('Select at least one combination'); return }
    if (!form.myPath.trim() || !form.whatIDo.trim() || !form.adviceForStudents.trim()) {
      setFormError('All story fields are required')
      return
    }
    try {
      await onSubmit(form)
    } catch {
      setFormError('Failed to create story. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
      <div className="bg-surface h-full w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-primary">Write a career story</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Professional selector */}
          <div>
            <p className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Professional
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProDropOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm text-left hover:border-primary transition-colors"
              >
                <span className={selectedPro ? 'text-foreground' : 'text-muted'}>
                  {selectedPro
                    ? `${selectedPro.firstName} ${selectedPro.lastName} — ${selectedPro.jobTitle}`
                    : 'Search and select a verified professional…'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />
              </button>
              {proDropOpen && (
                <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Type to filter…"
                      value={proSearch}
                      onChange={e => setProSearch(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <ul className="max-h-52 overflow-y-auto">
                    {filteredPros.length === 0 && (
                      <li className="px-3 py-2 text-xs text-muted">No professionals found</li>
                    )}
                    {filteredPros.map(p => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setForm(prev => ({ ...prev, professionalId: p.id }))
                            setProDropOpen(false)
                            setProSearch('')
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors"
                        >
                          <span className="font-medium text-foreground">{p.firstName} {p.lastName}</span>
                          <span className="text-muted ml-1.5">{p.jobTitle} · {p.sector}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Job title */}
          <div>
            <label htmlFor="story-job-title" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Job Title
            </label>
            <input
              id="story-job-title"
              type="text"
              value={form.jobTitle}
              onChange={e => setForm(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="e.g. Civil Engineer"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Sector */}
          <div>
            <label htmlFor="story-sector" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Sector
            </label>
            <select
              id="story-sector"
              value={form.sector}
              onChange={e => setForm(prev => ({ ...prev, sector: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Select a sector…</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Combinations */}
          <div>
            <CombinationPathwayPicker
              value={form.combinations}
              onChange={codes => setForm(prev => ({ ...prev, combinations: codes }))}
              mode="multi"
            />
          </div>

          {/* myPath */}
          <div>
            <label htmlFor="story-my-path" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              How I got here
            </label>
            <textarea
              id="story-my-path"
              value={form.myPath}
              onChange={e => setForm(prev => ({ ...prev, myPath: e.target.value }))}
              placeholder="Describe your academic and career journey in first-person…"
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y"
            />
          </div>

          {/* whatIDo */}
          <div>
            <label htmlFor="story-what-i-do" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              What I do
            </label>
            <textarea
              id="story-what-i-do"
              value={form.whatIDo}
              onChange={e => setForm(prev => ({ ...prev, whatIDo: e.target.value }))}
              placeholder="Describe your day-to-day work in first-person…"
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y"
            />
          </div>

          {/* adviceForStudents */}
          <div>
            <label htmlFor="story-advice" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Advice for students
            </label>
            <textarea
              id="story-advice"
              value={form.adviceForStudents}
              onChange={e => setForm(prev => ({ ...prev, adviceForStudents: e.target.value }))}
              placeholder="What would you tell A-Level students considering this path…"
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y"
            />
          </div>

          {formError && (
            <p className="text-xs text-error bg-error/5 border border-error/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="text-sm px-5 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {submitting ? 'Publishing…' : 'Publish story'}
          </button>
        </div>
      </div>
    </div>
  )
}



const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'PUBLISHED',      label: 'Published' },
  { key: 'REJECTED',       label: 'Rejected' },
]

const SKELETON_KEYS = ['a', 'b', 'c'] as const

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function StorySection({ title, children }: Readonly<{ title: string; children: string }>) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{title}</p>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  )
}

function RejectModal({
  onConfirm,
  onCancel,
  loading,
}: Readonly<{
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}>) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold text-primary">Reject story</h3>
        <textarea
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[100px] resize-y"
          placeholder="Explain why this story is being rejected..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className="text-sm px-4 py-2 rounded-lg bg-error text-white disabled:opacity-50 hover:bg-error/90 transition-colors"
          >
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StoryCard({
  story,
  tab,
  onApprove,
  onReject,
  onUnpublish,
  acting,
}: Readonly<{
  story: CareerStory
  tab: Tab
  onApprove: () => void
  onReject: () => void
  onUnpublish: () => void
  acting: boolean
}>) {
  const pro = story.professional
  const inits = initials(pro.firstName, pro.lastName)

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
          {inits}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            {pro.firstName} {pro.lastName}
          </p>
          <p className="text-xs text-muted truncate">{story.jobTitle} · {story.sector}</p>
        </div>
        {tab === 'PUBLISHED' && story.publishedAt && (
          <p className="text-xs text-muted flex-shrink-0">
            Published {new Date(story.publishedAt).toLocaleDateString()}
          </p>
        )}
        {tab === 'REJECTED' && story.createdAt && (
          <p className="text-xs text-muted flex-shrink-0">
            Submitted {new Date(story.createdAt).toLocaleDateString()}
          </p>
        )}
        {tab === 'PENDING_REVIEW' && (
          <p className="text-xs text-muted flex-shrink-0">
            Submitted {new Date(story.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {story.combinations.map(c => (
          <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
            {c}
          </span>
        ))}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <StorySection title="How I got here">{story.myPath}</StorySection>
        <StorySection title="What I do">{story.whatIDo}</StorySection>
        <StorySection title="Advice for students">{story.adviceForStudents}</StorySection>
      </div>

      {tab === 'REJECTED' && story.rejectionReason && (
        <div className="bg-error/5 border border-error/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-error mb-1">Rejection reason</p>
          <p className="text-sm text-foreground">{story.rejectionReason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        {tab === 'PENDING_REVIEW' && (
          <>
            <button
              onClick={onApprove}
              disabled={acting}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={acting}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-error text-error disabled:opacity-50 hover:bg-error/5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}

        {tab === 'PUBLISHED' && (
          <button
            onClick={onUnpublish}
            disabled={acting}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-muted text-muted disabled:opacity-50 hover:border-error hover:text-error transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Unpublish
          </button>
        )}

        {tab === 'REJECTED' && (
          <button
            onClick={onApprove}
            disabled={acting}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve
          </button>
        )}
      </div>
    </div>
  )
}

const EMPTY_MESSAGES: Record<Tab, { icon: React.ElementType; heading: string; sub: string }> = {
  PENDING_REVIEW: { icon: BookOpen, heading: 'All clear',        sub: 'No career stories pending review.' },
  PUBLISHED:      { icon: BookOpen, heading: 'Nothing published', sub: 'No published career stories yet.' },
  REJECTED:       { icon: XCircle,  heading: 'No rejections',    sub: 'No rejected career stories.' },
}

const AdminCareerStories = () => {
  const [tab, setTab] = useState<Tab>('PENDING_REVIEW')
  const { data: stories = [], isLoading: loading, isError } = useAdminCareerStoriesQuery(tab)
  const error = isError ? 'Failed to load stories' : ''
  const [actingId, setActingId] = useState<string | null>(null)

  const approveMutation = useApproveCareerStoryMutation()
  const rejectMutation = useRejectCareerStoryMutation()
  const unpublishMutation = useUnpublishCareerStoryMutation()
  const createMutation = useCreateCareerStoryMutation()

  const approve = async (id: string) => {
    setActingId(id)
    try {
      await approveMutation.mutateAsync({ id, tab })
    } finally {
      setActingId(null)
    }
  }

  const unpublish = async (id: string) => {
    setActingId(id)
    try {
      await unpublishMutation.mutateAsync({ id, tab })
    } finally {
      setActingId(null)
    }
  }

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [writeSubmitting, setWriteSubmitting] = useState(false)

  const handleReject = async (reason: string) => {
    if (!rejectingId) return
    const id = rejectingId
    setRejectingId(null)
    setActingId(id)
    try {
      await rejectMutation.mutateAsync({ id, reason, tab })
    } finally {
      setActingId(null)
    }
  }

  const handleWriteSubmit = async (data: typeof EMPTY_FORM) => {
    setWriteSubmitting(true)
    try {
      await createMutation.mutateAsync(data)
      setShowWriteModal(false)
    } finally {
      setWriteSubmitting(false)
    }
  }

  const empty = EMPTY_MESSAGES[tab]
  const EmptyIcon = empty.icon
  const TAB_LABELS: Record<Tab, string> = {
    PENDING_REVIEW: 'pending',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
  }
  const countLabel = TAB_LABELS[tab]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {SKELETON_KEYS.map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-64" />
          ))}
        </div>
      )
    }
    if (stories.length === 0) {
      return (
        <div className="text-center py-16">
          <EmptyIcon className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-sm font-semibold text-primary">{empty.heading}</p>
          <p className="text-xs text-muted mt-1">{empty.sub}</p>
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <p className="text-xs text-muted">{stories.length} {countLabel}</p>
        {stories.map(story => (
          <StoryCard
            key={story.id}
            story={story}
            tab={tab}
            onApprove={() => approve(story.id)}
            onReject={() => setRejectingId(story.id)}
            onUnpublish={() => unpublish(story.id)}
            acting={actingId === story.id}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Career Stories Review</h1>
          <p className="text-sm text-muted mt-0.5">
            Review and publish professional career stories submitted for the student library
          </p>
        </div>
        <button
          onClick={() => setShowWriteModal(true)}
          className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex-shrink-0 w-full sm:w-auto"
        >
          <PenLine className="w-3.5 h-3.5" />
          Write a story
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error/5 border border-error/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {renderContent()}

      {rejectingId && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setRejectingId(null)}
          loading={actingId === rejectingId}
        />
      )}

      {showWriteModal && (
        <WriteStoryModal
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleWriteSubmit}
          submitting={writeSubmitting}
        />
      )}
    </div>
  )
}

export default AdminCareerStories
