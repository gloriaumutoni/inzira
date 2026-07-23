import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, CheckCircle, GraduationCap, BookOpen, UserCheck } from 'lucide-react'
import { useAdminStatsQuery } from '@/hooks/queries/adminQueries'

const AdminOverview = () => {
  const { data: stats, isLoading: loading } = useAdminStatsQuery()
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary">Platform Overview</h1>
        <p className="text-sm text-muted mt-1">Real-time snapshot of Inzira's activity.</p>
      </div>

      {/* Top stats row */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded-xl h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Icon: CheckCircle,
              bg: 'bg-warning/10',
              color: 'text-warning',
              value: stats?.activeMentors ?? 0,
              label: 'Active Mentors',
              growth: null,
              positive: true,
            },
            {
              Icon: GraduationCap,
              bg: 'bg-primary/10',
              color: 'text-primary',
              value: stats?.approvedCareerGuides ?? 0,
              label: 'Approved Career Guides',
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

      {/* How it works + Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-primary mb-1">How Inzira Works</h2>
          <p className="text-sm text-muted mb-5">
            Inzira connects Rwandan secondary school students with verified professionals and career guides, helping them explore careers and make informed academic choices.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                Icon: Users,
                bg: 'bg-accent/10',
                color: 'text-accent',
                title: 'Students',
                desc: 'O-Level and A-Level students sign up, browse professionals by sector, and book career guidance sessions.',
              },
              {
                Icon: Briefcase,
                bg: 'bg-success/10',
                color: 'text-success',
                title: 'Professionals',
                desc: 'Industry professionals register, get admin-verified, and offer free intro and premium 1-on-1 sessions to students.',
              },
              {
                Icon: CheckCircle,
                bg: 'bg-warning/10',
                color: 'text-warning',
                title: 'Mentors',
                desc: 'Verified professionals apply for mentor status through an admin interview. Approved mentors run group sessions for many students at once.',
              },
              {
                Icon: GraduationCap,
                bg: 'bg-primary/10',
                color: 'text-primary',
                title: 'Career Guides',
                desc: 'School counselors registered on Inzira who support students within their school and help them navigate the platform.',
              },
              {
                Icon: BookOpen,
                bg: 'bg-error/10',
                color: 'text-error',
                title: 'Sessions',
                desc: 'Students book free intro sessions to explore careers, then upgrade to premium sessions for in-depth guidance with their chosen professional.',
              },
              {
                Icon: UserCheck,
                bg: 'bg-border',
                color: 'text-muted',
                title: 'Admin Role',
                desc: 'You verify professionals, approve mentor applications, manage interview slots, and oversee schools and career guides.',
              },
            ].map(({ Icon, bg, color, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{title}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-primary">Needs your attention</h2>
          <div className="space-y-4 mt-4">
            {[
              {
                count: stats?.pendingProfessionals ?? 0,
                cls: 'bg-warning/10 text-warning',
                label: 'Pending Professional Verifications',
                tab: 'professionals' as const,
              },
              {
                count: stats?.pendingMentors ?? 0,
                cls: 'bg-accent/10 text-accent',
                label: 'Pending Mentor Applications',
                tab: 'mentors' as const,
              },
              {
                count: stats?.pendingCareerGuides ?? 0,
                cls: 'bg-primary/10 text-primary',
                label: 'Pending Career Guide Verifications',
                tab: 'careerGuides' as const,
              },
            ].map(({ count, cls, label, tab }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${cls}`}>
                  {count}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">{label}</p>
                  <button
                    onClick={() => navigate('/admin/verification', { state: { tab } })}
                    className="text-xs text-accent hover:underline"
                  >
                    Review →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    </div>
  )
}

export default AdminOverview
