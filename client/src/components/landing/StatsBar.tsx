import useStats from '@/hooks/useStats'

const STAT_LABELS = [
  { key: 'students' as const,       label: 'STUDENTS',        suffix: '+' },
  { key: 'professionals' as const,  label: 'PROFESSIONALS',   suffix: '+' },
  { key: 'mentors' as const,        label: 'MENTORS',         suffix: '+' },
  { key: 'partnerSchools' as const, label: 'PARTNER SCHOOLS', suffix: ''  },
]

const formatStat = (value: number, suffix: string) => {
  if (suffix === '+' && value > 30) return `${value.toLocaleString()}+`
  return value.toLocaleString()
}

const StatsBar = () => {
  const { stats, loading, error } = useStats()

  return (
    <section className="bg-primary">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-4 divide-x divide-white/10">
          {STAT_LABELS.map(({ key, label, suffix }) => (
            <div key={key} className="flex flex-col items-center justify-center py-10 px-6">
              {loading ? (
                <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
              ) : error || !stats ? (
                <span className="text-3xl font-bold text-white">—</span>
              ) : (
                <span className="text-3xl font-bold text-white">
                  {formatStat(stats[key], suffix)}
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
