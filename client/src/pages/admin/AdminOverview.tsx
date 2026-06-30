import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  UserCheck,
  BookOpen,
  Video,
  CheckCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import useAdminStats from '@/hooks/useAdminStats'
import useVerification from '@/hooks/useVerification'
import InterviewSlotsPanel from '@/components/admin/InterviewSlotsPanel'

const BAR_RADIUS: [number, number, number, number] = [3, 3, 0, 0]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

function sessionIcon(type: string) {
  if (type === 'FREE_INTRO') return <BookOpen size={14} />
  if (type === 'PREMIUM') return <CheckCircle size={14} />
  return <Video size={14} />
}

function sessionIconBg(type: string): string {
  if (type === 'FREE_INTRO') return 'bg-warning/20 text-warning'
  if (type === 'PREMIUM') return 'bg-success/20 text-success'
  return 'bg-accent/20 text-accent'
}

function statusBadge(status: string): string {
  if (status === 'COMPLETED') return 'bg-success/10 text-success'
  if (status === 'CONFIRMED') return 'bg-accent/10 text-accent'
  if (status === 'CANCELLED') return 'bg-error/10 text-error'
  if (status === 'RESCHEDULED') return 'bg-warning/10 text-warning'
  return 'bg-border text-muted'
}

const AdminOverview = () => {
  const { stats, loading } = useAdminStats()
  const { professionals } = useVerification()
  const [search, setSearch] = useState('')
  const [chartPeriod, setChartPeriod] = useState<'1W' | '1M' | '6M'>('6M')

  const filteredGrowth =
    chartPeriod === '6M'
      ? (stats?.platformGrowth ?? [])
      : (stats?.platformGrowth ?? []).slice(-1)

  const filteredSessions = (stats?.recentSessions ?? []).filter(
    (s) =>
      !search ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Platform Overview</h1>
          <p className="text-sm text-muted mt-1">Real-time snapshot of Inzira's activity.</p>
        </div>
        <input
          type="text"
          placeholder="Search activity, students, or reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm w-64 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Top stats row */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              Icon: Users,
              bg: 'bg-accent/10',
              color: 'text-accent',
              value: stats?.totalStudents ?? 0,
              label: 'Total Students',
              growth: `+${stats?.newStudentsThisWeek ?? 0} new this week`,
              positive: true,
            },
            {
              Icon: Briefcase,
              bg: 'bg-success/10',
              color: 'text-success',
              value: stats?.activeProfessionals ?? 0,
              label: 'Active Professionals',
              growth: `+${stats?.newProfessionalsThisWeek ?? 0} this week`,
              positive: true,
            },
            {
              Icon: UserCheck,
              bg: 'bg-warning/10',
              color: 'text-warning',
              value: stats?.activeMentors ?? 0,
              label: 'Active Mentors',
              growth: null,
              positive: true,
            },
          ].map(({ Icon, bg, color, value, label, growth, positive }) => (
            <div key={label} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-primary">{value.toLocaleString()}</p>
                  {growth && (
                    <p className={`text-xs mt-0.5 ${positive ? 'text-success' : 'text-error'}`}>
                      {growth}
                    </p>
                  )}
                  <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-primary">Platform Growth</h2>
            <div className="flex gap-1 bg-background rounded-lg p-1">
              {(['1W', '1M', '6M'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={
                    chartPeriod === p
                      ? 'bg-surface shadow-sm text-primary text-xs px-3 py-1 rounded-md'
                      : 'text-muted text-xs px-3 py-1'
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse bg-border rounded-xl h-48 mt-4" />
          ) : filteredGrowth.length < 2 ? (
            <p className="text-sm text-muted mt-6">Not enough data to display chart.</p>
          ) : (
            <div style={{ width: '100%', height: 220 }} className="mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredGrowth} barGap={2} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sessions" name="Sessions" fill="#0F2B46" radius={BAR_RADIUS} />
                  <Bar dataKey="students" name="Students" fill="#1A6B8A" radius={BAR_RADIUS} />
                  <Bar dataKey="revenue" name="Revenue (k RWF)" fill="#16A34A" radius={BAR_RADIUS} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Needs your attention</h2>
          <div className="space-y-4 mt-4">
            {[
              {
                count: professionals.length,
                cls: 'bg-warning/10 text-warning',
                label: 'Pending Professional Verifications',
                to: '/admin/verification',
              },
              {
                count: 0,
                cls: 'bg-error/10 text-error',
                label: 'Flagged Content Reports',
                to: '#',
              },
            ].map(({ count, cls, label, to }) => (
              <div key={label} className="flex items-start gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${cls}`}
                >
                  {count}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">{label}</p>
                  <Link to={to} className="text-xs text-accent hover:underline">
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-primary">Recent Sessions</h2>
          <span className="text-sm text-accent cursor-default select-none">View All</span>
        </div>
        {loading ? (
          <div className="space-y-3 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-border rounded h-12" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <p className="text-sm text-muted mt-4">No recent sessions.</p>
        ) : (
          <div className="mt-4">
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sessionIconBg(s.type)}`}
                >
                  {sessionIcon(s.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">Session #{s.id.slice(0, 4).toUpperCase()}</p>
                  <p className="text-xs text-muted">
                    {s.studentCode} · {s.grade}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">{timeAgo(s.scheduledAt)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge(s.status)}`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform health */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-primary">Platform Health</h2>
        {loading ? (
          <div className="animate-pulse bg-border rounded h-24 mt-4" />
        ) : (
          <div className="space-y-3 mt-4">
            {[
              {
                label: 'Verification queue clear',
                render: () =>
                  stats?.platformHealth.verificationQueueClear ? (
                    <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  ),
              },
              {
                label: 'Commission rate',
                render: () => (
                  <span className="text-sm font-semibold text-primary">
                    {stats?.platformHealth.commissionRate ?? 15}%
                  </span>
                ),
              },
              {
                label: 'Sessions this week',
                render: () => (
                  <span className="text-sm font-semibold text-primary">
                    {stats?.platformHealth.sessionsPerWeek ?? 0}
                  </span>
                ),
              },
              {
                label: 'Active ambassadors',
                render: () => (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {stats?.platformHealth.activeAmbassadors ?? 0}
                    </span>
                    <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
                      Broadcasting
                    </span>
                  </div>
                ),
              },
            ].map(({ label, render }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-muted">{label}</span>
                {render()}
              </div>
            ))}
          </div>
        )}
      </div>

      <InterviewSlotsPanel />

    </div>
  )
}

export default AdminOverview
