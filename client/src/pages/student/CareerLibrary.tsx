import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, BookOpen, Briefcase, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { type CareerStory } from '@/api/careerStories.api'
import { useCareerStoriesQuery, useCareerStoryQuery } from '@/hooks/queries/studentQueries'
import { useCareerStoryCombinationsQuery } from '@/hooks/queries/professionalDashboardQueries'
import ProfessionalProfileModal from '@/components/professionals/ProfessionalProfileModal'

const SECTORS = [
  'Engineering', 'Healthcare', 'Technology', 'Finance & Banking',
  'Education', 'Agriculture', 'Media & Communications', 'Law',
  'Public Service', 'Business & Entrepreneurship',
]

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
const SKELETONS = ['s0', 's1', 's2', 's3', 's4', 's5']

function Avatar({ story, size }: Readonly<{ story: CareerStory; size: 'sm' | 'lg' }>) {
  const initials = `${story.professional.firstName[0] ?? ''}${story.professional.lastName[0] ?? ''}`.toUpperCase()
  const cls = size === 'lg'
    ? 'w-14 h-14 rounded-full text-lg font-bold flex items-center justify-center flex-shrink-0'
    : 'w-10 h-10 rounded-full text-sm font-semibold flex items-center justify-center flex-shrink-0'

  if (story.professional.profilePhoto) {
    return (
      <img
        src={story.professional.profilePhoto}
        alt={`${story.professional.firstName} ${story.professional.lastName}`}
        className={`${cls} object-cover`}
      />
    )
  }
  return (
    <div className={`${cls} bg-primary/10 text-primary`}>
      {initials}
    </div>
  )
}

function StoryCard({ story, onClick }: Readonly<{ story: CareerStory; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <Avatar story={story} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            {story.professional.firstName} {story.professional.lastName}
          </p>
          <p className="text-xs text-muted truncate">
            {story.jobTitle} · {story.professional.employer}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {story.combinations.map(c => (
          <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
            {c}
          </span>
        ))}
        <span className="text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">
          {story.sector}
        </span>
      </div>

      <p className="text-xs text-muted line-clamp-3">{story.myPath}</p>
    </button>
  )
}

function StoryDetail({ story, onBack }: Readonly<{ story: CareerStory; onBack: () => void }>) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to library
      </button>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar story={story} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-primary">
              {story.professional.firstName} {story.professional.lastName}
            </h2>
            <p className="text-sm text-muted">
              {story.jobTitle} · {story.professional.employer}
            </p>
            <p className="text-xs text-muted mt-0.5">{story.sector}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {story.combinations.map(c => (
                <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Section icon={<BookOpen className="w-4 h-4" />} title="How I got here">
          {story.myPath}
        </Section>

        <Section icon={<Briefcase className="w-4 h-4" />} title="What my work actually involves">
          {story.whatIDo}
        </Section>

        <Section icon={<Users className="w-4 h-4" />} title="Advice for students considering this combination">
          {story.adviceForStudents}
        </Section>

        <button
          onClick={() => setShowProfile(true)}
          className="w-full bg-primary text-white text-sm font-medium py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          View sessions with {story.professional.firstName}
        </button>
      </div>

      {showProfile && (
        <ProfessionalProfileModal
          professionalId={story.professionalId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  )
}

function Section({ icon, title, children }: Readonly<{ icon: React.ReactNode; title: string; children: string }>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  )
}

const CareerLibrary = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedStory, setSelectedStory] = useState<CareerStory | null>(null)

  const storyIdParam = searchParams.get('story')
  const { data: deepLinkStory, isLoading: deepLinkLoading } = useCareerStoryQuery(storyIdParam, !!storyIdParam)
  const activeStory = selectedStory ?? deepLinkStory ?? null

  const handleBack = () => {
    setSelectedStory(null)
    if (storyIdParam) setSearchParams(prev => { prev.delete('story'); return prev })
  }

  const studentCombos = user?.student?.combinationsConsidering ?? []
  const defaultCombo = studentCombos[0] ?? ''
  const studentInterests = user?.student?.careerInterests ?? []

  const [search, setSearch] = useState('')
  const [combo, setCombo] = useState(defaultCombo)
  const [sector, setSector] = useState('')
  const [matchInterests, setMatchInterests] = useState(false)
  const [page, setPage] = useState(1)
  const LIMIT = 12

  const { data: combinations = [] } = useCareerStoryCombinationsQuery()

  const { data: storiesRes, isLoading: loading } = useCareerStoriesQuery({
    search: search || undefined,
    combination: combo || undefined,
    sector: sector || undefined,
    interests: !search && matchInterests && studentInterests.length > 0
      ? studentInterests.join(',')
      : undefined,
    page,
    limit: LIMIT,
  })
  const stories = storiesRes?.stories ?? []
  const total = storiesRes?.total ?? 0

  useEffect(() => {
    setPage(1)
  }, [search, combo, sector, matchInterests])

  if (storyIdParam && deepLinkLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse bg-border rounded-xl h-64" />
      </div>
    )
  }

  if (activeStory) {
    return (
      <div className="p-6">
        <StoryDetail story={activeStory} onBack={handleBack} />
      </div>
    )
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Career Library</h1>
        <p className="text-sm text-muted mt-0.5">
          Real stories from professionals who started with a Rwanda A-Level combination or pathway
        </p>
        {studentCombos.length > 0 && (
          <p className="text-xs text-accent mt-1">
            Showing results for your combination or pathway · change below to explore more
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by job, sector, or story..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={combo}
          onChange={e => setCombo(e.target.value)}
          className="text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="">All combinations/pathways</option>
          {combinations.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="text-sm bg-surface border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="">All careers</option>
          {SECTORS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {studentInterests.length > 0 && (
          <button
            type="button"
            onClick={() => setMatchInterests(v => !v)}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors whitespace-nowrap ${
              matchInterests
                ? 'bg-primary text-white border-primary'
                : 'bg-surface border-border hover:border-primary'
            }`}
          >
            Match my interests
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted">
          {total} {total === 1 ? 'story' : 'stories'} found
        </p>
      )}

      {/* Grid */}
      {loading && (
        <div className={GRID}>
          {SKELETONS.map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-44" />
          ))}
        </div>
      )}
      {!loading && stories.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No stories match your filters.</p>
          {(search || combo || sector || matchInterests) && (
            <button
              onClick={() => { setSearch(''); setCombo(''); setSector(''); setMatchInterests(false) }}
              className="mt-3 text-xs text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      {!loading && stories.length > 0 && (
        <>
          <div className={GRID}>
            {stories.map(story => (
              <StoryCard key={story.id} story={story} onClick={() => setSelectedStory(story)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:border-primary transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:border-primary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CareerLibrary
