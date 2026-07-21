import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, GraduationCap, ListChecks, Sparkles, Users, BookOpen, Clock, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCareerRoadmap } from '@/hooks/queries/studentQueries'
import { STREAM_MAP, type StreamCode } from '@/constants/streams'
import type { RoadmapMentor, RoadmapStory, UniversityProgram, RoadmapStep } from '@/api/careers.api'

const streamName = (code: string) => STREAM_MAP[code as StreamCode]?.name ?? code

const fmtCost = (rwf?: number) => {
  if (rwf === undefined || rwf === null) return null
  if (rwf === 0) return 'Free / government-sponsored'
  return `~${rwf.toLocaleString()} RWF`
}

function SectionHeader({ icon, title, hint }: Readonly<{ icon: React.ReactNode; title: string; hint?: string }>) {
  return (
    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
      {icon}
      <span>{title}</span>
      {hint && <span className="text-xs font-normal text-muted">· {hint}</span>}
    </div>
  )
}

function EmptyNote({ children }: Readonly<{ children: string }>) {
  return <p className="text-xs text-muted italic">{children}</p>
}

function ProgramCard({ p }: Readonly<{ p: UniversityProgram }>) {
  const cost = fmtCost(p.indicativeCostRwf)
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
      <p className="text-sm font-semibold text-primary">{p.program}</p>
      {p.institutions && p.institutions.length > 0 && (
        <p className="text-xs text-muted">{p.institutions.join(' · ')}</p>
      )}
      {p.entryRequirements && (
        <p className="text-xs text-foreground"><span className="font-medium">Entry:</span> {p.entryRequirements}</p>
      )}
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {p.durationYears ? <span>{p.durationYears} yrs</span> : null}
        {cost ? <span>{cost}</span> : null}
      </div>
    </div>
  )
}

function StepRow({ step, last }: Readonly<{ step: RoadmapStep; last: boolean }>) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step.order}
        </div>
        {!last && <div className="w-px flex-1 bg-border my-1" />}
      </div>
      <div className="pb-5">
        <p className="text-sm font-semibold text-primary">{step.title}</p>
        {step.timeframe && (
          <p className="text-xs text-accent flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {step.timeframe}
          </p>
        )}
        <p className="text-xs text-muted mt-1 leading-relaxed whitespace-pre-wrap">{step.detail}</p>
      </div>
    </div>
  )
}

function MentorCard({ m, onTalk }: Readonly<{ m: RoadmapMentor; onTalk: () => void }>) {
  const initials = `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase()
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {m.profilePhoto ? (
          <img src={m.profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary truncate">{m.firstName} {m.lastName}</p>
          <p className="text-xs text-muted truncate">{m.jobTitle} · {m.employer}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onTalk}
        className="mt-auto w-full bg-accent text-white text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors"
      >
        Book a session
      </button>
    </div>
  )
}

function StoryCard({ s }: Readonly<{ s: RoadmapStory }>) {
  return (
    <Link
      to={`/student/career-library?story=${s.id}`}
      className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1 hover:border-primary/40 transition-colors"
    >
      <p className="text-sm font-semibold text-primary leading-tight">{s.jobTitle}</p>
      <p className="text-xs text-muted">{s.professional.firstName} {s.professional.lastName} · {s.professional.employer}</p>
      {(s.universityStudied || s.program) && (
        <p className="text-xs text-muted">
          {[s.program, s.universityStudied].filter(Boolean).join(' — ')}
        </p>
      )}
      <p className="text-xs text-muted line-clamp-2 mt-1">{s.myPath}</p>
      {s.yearsToGetThere != null && (
        <span className="text-xs text-accent">~{s.yearsToGetThere} yrs to get there</span>
      )}
      <span className="text-xs text-accent mt-auto">Read story →</span>
    </Link>
  )
}

const CareerRoadmap = () => {
  const { careerId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: roadmap, isLoading, error } = useCareerRoadmap(careerId)

  const myStream = user?.student?.streamCode ?? null
  const myCombination = user?.student?.combination ?? null

  const talkToMentor = () => {
    const combo = roadmap?.requiredCombinations?.[0]
    navigate('/student/get-mentor', combo ? { state: { combination: combo } } : undefined)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse bg-border rounded-xl h-72" />
      </div>
    )
  }

  if (error || !roadmap) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-sm text-muted">This roadmap could not be loaded.</p>
      </div>
    )
  }

  let isDirect = false
  if (myStream) isDirect = roadmap.requiredStreams.includes(myStream)
  else if (myCombination) isDirect = roadmap.requiredCombinations.includes(myCombination)
  const reachable = isDirect ? 'DIRECT' : 'STRETCH'
  const hasStreamContext = Boolean(myStream || myCombination)

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-primary">{roadmap.title}</h1>
          <span className="text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">{roadmap.sector}</span>
          {hasStreamContext && (
            <span
              title={
                reachable === 'DIRECT'
                  ? 'Your stream directly qualifies for this path'
                  : 'Reachable with one extra requirement — see the steps below for how'
              }
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                reachable === 'DIRECT'
                  ? 'bg-success/10 text-success'
                  : 'bg-amber-500/10 text-amber-600'
              }`}
            >
              {reachable === 'DIRECT' ? 'Direct from your stream' : 'Reachable with effort'}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{roadmap.description}</p>
      </div>

      {/* Required stream(s) vs mine */}
      <section className="space-y-2">
        <SectionHeader icon={<MapPin className="w-4 h-4" />} title="Required stream(s)" />
        <div className="flex flex-wrap gap-1.5">
          {roadmap.requiredStreams.length === 0 && <EmptyNote>No specific stream required.</EmptyNote>}
          {roadmap.requiredStreams.map(code => {
            const mine = code === myStream
            return (
              <span
                key={code}
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  mine ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                }`}
              >
                {mine && <CheckCircle2 className="w-3 h-3" />}
                {streamName(code)}
              </span>
            )
          })}
        </div>
        {myStream && !isDirect && (
          <p className="text-xs text-muted">
            Your stream is <span className="font-medium">{streamName(myStream)}</span>. This path usually starts from
            a different stream — the steps below show what it takes to bridge across.
          </p>
        )}
        {roadmap.requiredCombinations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-muted self-center">Legacy combinations:</span>
            {roadmap.requiredCombinations.map(c => (
              <span key={c} className="text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        )}
      </section>

      {/* University programs */}
      <section className="space-y-2">
        <SectionHeader icon={<GraduationCap className="w-4 h-4" />} title="University programs" />
        {roadmap.universityPrograms.length === 0 ? (
          <EmptyNote>Program details coming soon — check back later.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roadmap.universityPrograms.map((p, i) => <ProgramCard key={`${p.program}-${i}`} p={p} />)}
          </div>
        )}
      </section>

      {/* Step timeline */}
      <section className="space-y-3">
        <SectionHeader icon={<ListChecks className="w-4 h-4" />} title="What it takes — step by step" />
        {roadmap.steps.length === 0 ? (
          <EmptyNote>The step-by-step guide for this path is being built.</EmptyNote>
        ) : (
          <div className="pt-1">
            {roadmap.steps.map((s, i) => (
              <StepRow key={s.order} step={s} last={i === roadmap.steps.length - 1} />
            ))}
          </div>
        )}
      </section>

      {/* Key skills */}
      <section className="space-y-2">
        <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Key skills" />
        {roadmap.keySkills.length === 0 ? (
          <EmptyNote>Skill guidance coming soon.</EmptyNote>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {roadmap.keySkills.map(s => (
              <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
        )}
      </section>

      {/* Mentors */}
      <section className="space-y-2">
        <SectionHeader icon={<Users className="w-4 h-4" />} title="Talk to someone on this path" hint={`${roadmap.mentors.length} available`} />
        {roadmap.mentors.length === 0 ? (
          <EmptyNote>No mentor yet for this path — check back soon.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roadmap.mentors.map(m => <MentorCard key={m.id} m={m} onTalk={talkToMentor} />)}
          </div>
        )}
        <button
          type="button"
          onClick={talkToMentor}
          className="text-xs text-accent hover:underline"
        >
          Browse all mentors for this path →
        </button>
      </section>

      {/* Stories */}
      <section className="space-y-2">
        <SectionHeader icon={<BookOpen className="w-4 h-4" />} title="Real stories from this field" hint={`${roadmap.stories.length}`} />
        {roadmap.stories.length === 0 ? (
          <EmptyNote>No stories yet for this path.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roadmap.stories.map(s => <StoryCard key={s.id} s={s} />)}
          </div>
        )}
      </section>
    </div>
  )
}

export default CareerRoadmap
