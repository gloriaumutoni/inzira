import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Users, BookOpen, ArrowRight } from 'lucide-react'
import { useReachableCareers } from '@/hooks/queries/studentQueries'
import { STREAM_MAP, type StreamCode } from '@/constants/streams'
import type { CareerCard } from '@/api/careers.api'

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
const SKELETONS = ['s0', 's1', 's2', 's3', 's4', 's5']

type Tab = 'direct' | 'stretch'

function Card({ c }: Readonly<{ c: CareerCard }>) {
  return (
    <Link
      to={`/student/career-roadmap/${c.id}`}
      className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-2 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-primary leading-tight">{c.title}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            c.reachability === 'DIRECT' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {c.reachability === 'DIRECT' ? 'Direct' : 'Stretch'}
        </span>
      </div>
      <span className="self-start text-xs bg-muted/10 text-muted px-2 py-0.5 rounded-full">{c.sector}</span>
      <p className="text-xs text-muted line-clamp-3">{c.shortDescription}</p>
      <div className="flex items-center gap-3 text-xs text-muted mt-auto pt-1">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.mentorCount} mentor{c.mentorCount === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {c.storyCount} stor{c.storyCount === 1 ? 'y' : 'ies'}</span>
        <ArrowRight className="w-3.5 h-3.5 text-accent ml-auto" />
      </div>
    </Link>
  )
}

const ReachExplorer = () => {
  const { data, isLoading, error } = useReachableCareers()
  const [tab, setTab] = useState<Tab>('direct')

  const reachable = data?.reachable ?? []
  const stretch = data?.stretch ?? []
  const fromStream = data?.fromStream ?? null
  const streamName = fromStream ? STREAM_MAP[fromStream as StreamCode]?.name : null

  const active = tab === 'direct' ? reachable : stretch

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Compass className="w-5 h-5" /> Explore Careers
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {fromStream
            ? <>Careers you can reach from your stream <span className="font-medium text-accent">{streamName ?? fromStream}</span></>
            : 'Careers you can reach from your stream'}
        </p>
      </div>

      {!isLoading && !error && !fromStream && (
        <div className="text-center py-16">
          <Compass className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Set your A-Level stream on your profile to see careers you can reach.</p>
        </div>
      )}

      {fromStream && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('direct')}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                tab === 'direct' ? 'bg-primary text-white border-primary' : 'bg-surface border-border hover:border-primary'
              }`}
            >
              Direct <span className="opacity-70">({reachable.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('stretch')}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                tab === 'stretch' ? 'bg-primary text-white border-primary' : 'bg-surface border-border hover:border-primary'
              }`}
            >
              Stretch <span className="opacity-70">({stretch.length})</span>
            </button>
          </div>

          {tab === 'stretch' && stretch.length > 0 && (
            <p className="text-xs text-muted bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              Stretch careers are reachable with one extra or bridging requirement. They&apos;re options to consider —
              not a sign you chose the wrong stream. Open any roadmap to see exactly what it takes.
            </p>
          )}

          {isLoading && (
            <div className={GRID}>
              {SKELETONS.map(k => <div key={k} className="animate-pulse bg-border rounded-xl h-40" />)}
            </div>
          )}

          {error && <p className="text-sm text-muted">Could not load careers. Please try again.</p>}

          {!isLoading && !error && active.length === 0 && (
            <div className="text-center py-16">
              <Compass className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">
                {tab === 'direct'
                  ? 'No direct careers mapped for your combination yet.'
                  : 'No stretch careers found yet — check the Direct tab.'}
              </p>
            </div>
          )}

          {!isLoading && !error && active.length > 0 && (
            <div className={GRID}>
              {active.map(c => <Card key={c.id} c={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReachExplorer
