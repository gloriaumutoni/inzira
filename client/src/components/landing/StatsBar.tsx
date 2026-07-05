import useStats from '@/hooks/useStats'

const STAT_LABELS = [
  { key: 'oLevelStudents' as const,  label: 'O-LEVEL STUDENTS' },
  { key: 'aLevelStudents' as const,  label: 'A-LEVEL STUDENTS' },
  { key: 'professionals' as const,   label: 'PROFESSIONALS' },
  { key: 'mentors' as const,         label: 'MENTORS' },
  { key: 'careerGuides' as const,    label: 'CAREER GUIDES' },
  { key: 'partnerSchools' as const,  label: 'PARTNER SCHOOLS' },
]

const StatsBar = () => {
  const { stats, loading, error } = useStats()

  return (
    <section className="bg-primary">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-white/10">
          {STAT_LABELS.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center justify-center py-10 px-6">
              {loading ? (
                <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
              ) : error || !stats ? (
                <span className="text-3xl font-bold text-white">—</span>
              ) : (
                <span className="text-3xl font-bold text-white">
                  {stats[key].toLocaleString()}
                </span>
              )}
              <span className="text-xs text-subtle uppercase tracking-widest mt-2">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsBar
