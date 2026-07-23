import { AlertTriangle } from 'lucide-react'
import { useCoverageGaps } from '@/hooks/queries/professionalDashboardQueries'

export function CoverageGapsPanel({ onWriteStory }: Readonly<{
  onWriteStory: (gap: { careerId: string; careerTitle: string; streamCode: string }) => void
}>) {
  const { data, isLoading } = useCoverageGaps()

  if (isLoading) {
    return <div className="animate-pulse bg-border rounded-xl h-20" />
  }

  const gaps = data?.gaps ?? []
  if (gaps.length === 0) return null

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h2 className="text-base font-semibold text-primary">Careers still needing a story or mentor in your area</h2>
      </div>
      <p className="text-xs text-muted -mt-1">
        These careers in your stream have no published story or verified mentor yet. Writing one helps students see a real path.
      </p>
      <div className="space-y-2">
        {gaps.slice(0, 6).map(gap => (
          <div
            key={`${gap.careerId}-${gap.streamCode}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background border border-border rounded-lg px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary truncate">{gap.careerTitle}</p>
              <p className="text-xs text-muted">
                {gap.streamName} · {gap.mentorCount} mentor{gap.mentorCount === 1 ? '' : 's'} · {gap.storyCount} stor{gap.storyCount === 1 ? 'y' : 'ies'}
              </p>
            </div>
            <button
              onClick={() => onWriteStory({ careerId: gap.careerId, careerTitle: gap.careerTitle, streamCode: gap.streamCode })}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors self-start sm:self-auto"
            >
              Write a story
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
