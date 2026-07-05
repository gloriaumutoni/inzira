import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CombinationTrend } from '@/hooks/useConfidenceLogs'

interface Props {
  trends: CombinationTrend[]
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const CombinationConfidenceChart = ({ trends }: Props) => {
  if (trends.length === 0) return null

  // Build unified date-indexed dataset
  const allDates = [...new Set(
    trends.flatMap(t => t.logs.map(l => l.createdAt))
  )].sort()

  const chartData = allDates.map(date => {
    const point: Record<string, string | number> = { date: fmtDate(date) }
    for (const trend of trends) {
      const log = trend.logs.find(l => l.createdAt === date)
      if (log) point[trend.combination] = log.score
    }
    return point
  })

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-primary mb-4">Confidence by combination</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 3, 5, 7, 10]}
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {trends.map((trend, i) => (
            <Line
              key={trend.combination}
              type="monotone"
              dataKey={trend.combination}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CombinationConfidenceChart
