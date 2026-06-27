import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import useCompanyWorkshops from '@/hooks/useCompanyWorkshops'
import { getSectorStyle } from '@/utils/sectorColors'
import { api } from '@/api/axios'

interface RegistrationData {
  total: number
  byLevel: Record<string, number>
  byCombination: Record<string, number>
  bySchool: Record<string, number>
}

const DonutChart = ({
  oLevel,
  aLevel,
}: {
  oLevel: number
  aLevel: number
}) => {
  const total = oLevel + aLevel
  if (total === 0) return null
  const cx = 60
  const cy = 60
  const r = 44
  const circumference = 2 * Math.PI * r
  const oLevelPct = oLevel / total
  return (
    <svg width="120" height="120" className="mx-auto">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0F2B46" strokeWidth="16" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#1A6B8A"
        strokeWidth="16"
        strokeDasharray={`${oLevelPct * circumference} ${circumference}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-xs">
        <tspan x={cx} dy="-6" fontSize="18" fontWeight="bold" fill="#0F2B46">
          {total}
        </tspan>
        <tspan x={cx} dy="18" fontSize="10" fill="#64748B">
          students
        </tspan>
      </text>
    </svg>
  )
}

const CompanyInsights = () => {
  const { workshops, loading: wsLoading } = useCompanyWorkshops()

  const [allRegData, setAllRegData] = useState<RegistrationData[]>([])
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState(false)

  useEffect(() => {
    if (wsLoading || workshops.length === 0) return
    const published = workshops.filter((w) => w.isPublished)
    if (published.length === 0) return

    const fetchAll = async () => {
      setRegLoading(true)
      setRegError(false)
      try {
        const results = await Promise.all(
          published.map((w) =>
            api.get(`/workshops/${w.id}/registrations`).then((r) => r.data.data as RegistrationData)
          )
        )
        setAllRegData(results)
      } catch {
        setRegError(true)
      } finally {
        setRegLoading(false)
      }
    }
    fetchAll()
  }, [workshops, wsLoading])

  const totalStudents = workshops.reduce((sum, w) => sum + w.registrationCount, 0)

  const aggregatedSchools = allRegData.reduce<Record<string, number>>((acc, rd) => {
    for (const [school, count] of Object.entries(rd.bySchool)) {
      acc[school] = (acc[school] ?? 0) + count
    }
    return acc
  }, {})

  const aggregatedCombinations = allRegData.reduce<Record<string, number>>((acc, rd) => {
    for (const [combo, count] of Object.entries(rd.byCombination)) {
      acc[combo] = (acc[combo] ?? 0) + count
    }
    return acc
  }, {})

  const totalOLevel = allRegData.reduce((sum, rd) => sum + (rd.byLevel['O_LEVEL'] ?? 0), 0)
  const totalALevel = allRegData.reduce((sum, rd) => sum + (rd.byLevel['A_LEVEL'] ?? 0), 0)

  const schoolsRepresented = Object.keys(aggregatedSchools).length
  const topSchools = Object.entries(aggregatedSchools)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const topCombinations = Object.entries(aggregatedCombinations).sort((a, b) => b[1] - a[1])

  const sectorMap = workshops.reduce<Record<string, number>>((acc, w) => {
    acc[w.sector] = (acc[w.sector] ?? 0) + w.registrationCount
    return acc
  }, {})
  const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const sectorList = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])

  const chartData = (() => {
    const byMonth: Record<string, number> = {}
    for (const w of workshops) {
      if (!w.date) continue
      const month = new Date(w.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      byMonth[month] = (byMonth[month] ?? 0) + w.registrationCount
    }
    return Object.entries(byMonth)
      .sort((a, b) => new Date(`01 ${a[0]}`).getTime() - new Date(`01 ${b[0]}`).getTime())
      .map(([month, count]) => ({ month, count }))
  })()

  const hasChartData = chartData.length >= 2

  if (wsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse bg-border rounded-xl h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-24" />
          ))}
        </div>
        <div className="animate-pulse bg-border rounded-xl h-48" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary">Workshop Insights</h1>
          <p className="text-sm text-muted mt-1">
            Real-time data on student engagement and career trends.
          </p>
        </div>
        <button className="border border-border text-primary text-sm px-4 py-2 rounded-lg hover:bg-background transition-colors">
          Export Report
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-primary">{totalStudents}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Total Students Reached</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-primary">
            {schoolsRepresented > 0 ? schoolsRepresented : '—'}
          </p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Schools Represented</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-accent">{topSector}</p>
          <p className="text-xs text-muted uppercase tracking-wide mt-1">Top Sector of Interest</p>
        </div>
      </div>

      {/* Registrations Over Time */}
      <div className="bg-surface rounded-xl border border-border p-5 mt-6">
        <h2 className="text-base font-semibold text-primary">Registrations Over Time</h2>
        {wsLoading ? (
          <div className="animate-pulse bg-border rounded-xl h-48 mt-4" />
        ) : hasChartData ? (
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A6B8A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1A6B8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1A6B8A"
                  strokeWidth={2}
                  fill="url(#regGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-12">
            Not enough data to display a chart yet.
          </p>
        )}
      </div>

      {/* Two-column: Sector + Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-primary">Career Interests by Sector</h2>
          <div className="space-y-3 mt-4">
            {sectorList.length === 0 ? (
              <p className="text-xs text-muted">No sector data yet.</p>
            ) : (
              sectorList.map(([sector, count]) => {
                const style = getSectorStyle(sector)
                return (
                  <div key={sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: style.bg }}
                      />
                      <span className="text-sm text-primary">{sector}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted">{count}</span>
                      <span className="text-xs text-success">—</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-primary">Top Performing Schools</h2>
          {regLoading ? (
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-border rounded h-6" />
              ))}
            </div>
          ) : regError ? (
            <p className="text-xs text-muted mt-4">School data unavailable.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {topSchools.length === 0 ? (
                <p className="text-xs text-muted">No school data yet.</p>
              ) : (
                topSchools.map(([school, count]) => (
                  <div key={school} className="flex items-center justify-between">
                    <span className="text-sm text-primary truncate mr-3">{school}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-muted">{count}</span>
                      <span className="text-xs text-success">—</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* A-Level Combinations */}
      <div className="bg-surface rounded-xl border border-border p-5 mt-6">
        <h2 className="text-base font-semibold text-primary">A-Level Combinations</h2>
        {regLoading ? (
          <div className="flex flex-wrap gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-border rounded-full h-7 w-24" />
            ))}
          </div>
        ) : topCombinations.length === 0 ? (
          <p className="text-xs text-muted mt-4">No combination data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {topCombinations.map(([combo, count]) => (
              <span
                key={combo}
                className="bg-accent/10 text-accent text-xs px-3 py-1.5 rounded-full font-medium"
              >
                {combo} ({count} students)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Student Level Breakdown */}
      <div className="bg-surface rounded-xl border border-border p-5 mt-6">
        <h2 className="text-base font-semibold text-primary mb-4">Student Level Breakdown</h2>
        {totalOLevel + totalALevel === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'O-Level', value: 0 },
              { label: 'A-Level', value: 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted mt-1">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="flex flex-col items-center">
              <DonutChart oLevel={totalOLevel} aLevel={totalALevel} />
            </div>
            <div className="space-y-4">
              {[
                { label: 'O-Level', value: totalOLevel, color: '#1A6B8A' },
                { label: 'A-Level', value: totalALevel, color: '#0F2B46' },
              ].map(({ label, value, color }) => {
                const pct =
                  totalOLevel + totalALevel > 0
                    ? Math.round((value / (totalOLevel + totalALevel)) * 100)
                    : 0
                return (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-medium text-primary">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{value}</p>
                    <p className="text-xs text-muted">{pct}% of total</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyInsights
