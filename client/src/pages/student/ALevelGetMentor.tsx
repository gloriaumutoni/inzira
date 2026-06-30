import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const PRO_FEATURES = [
  '1 dedicated 1-on-1 session',
  'Choose any verified professional',
  'Direct booking — no waiting',
  'Session notes shared after',
]

const PREMIUM_FEATURES = [
  '2 dedicated sessions per month',
  'Priority booking on exclusive slots',
  'Same professional every session',
  'Unlimited follow-up messages',
]

const TABLE_ROWS = [
  { feature: 'Group sessions',      free: 'Unlimited', pro: 'Unlimited',         premium: 'Unlimited' },
  { feature: 'Free intro sessions', free: '1 per pro', pro: '1 per pro',         premium: '1 per pro' },
  { feature: 'Private sessions',    free: '—',         pro: '1 per booking',     premium: '2 per month' },
  { feature: 'Private slots',       free: '—',         pro: '—',                 premium: 'Unlimited' },
  { feature: 'Session recording',   free: '—',         pro: '—',                 premium: 'Yes' },
  { feature: 'Monthly cost',        free: 'Free',      pro: 'RWF 5,000/session', premium: 'RWF 10,000' },
]

const ALevelGetMentor = () => {
  const { user } = useAuth()
  const mentorPlan = user?.student?.mentorPlan ?? 'FREE'

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-primary">Get a Mentor</h1>
      <p className="text-sm text-muted mt-1">Go beyond free sessions. Pick a plan that suits you.</p>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-primary">What mentorship means here</p>
        <p className="text-xs text-muted mt-1 leading-relaxed">
          A mentor is a working Rwandan professional who volunteers their time to talk with you about their career path. You can join their free group sessions to hear their story, or book a free 20-minute intro call to ask your own questions — all over video call.
        </p>
      </div>

      {/* Current plan banner */}
      <div
        className={[
          'rounded-xl p-4 mt-6',
          mentorPlan === 'FREE'
            ? 'bg-accent/10 border border-accent/20'
            : 'bg-success/10 border border-success/20',
        ].join(' ')}
      >
        {mentorPlan === 'FREE' ? (
          <p className="text-sm text-primary font-medium">
            You are on the <strong>Free</strong> plan. Upgrade to unlock 1-on-1 mentorship.
          </p>
        ) : (
          <p className="text-sm text-primary font-medium">
            You are on the <strong>{mentorPlan}</strong> plan.
          </p>
        )}
      </div>

      {/* Free intro callout */}
      <div className="bg-primary rounded-xl p-6 text-white mt-6">
        <h2 className="text-base font-bold">Start with a free intro session — no plan needed</h2>
        <p className="text-sm text-white/80 mt-2">
          Every professional offers a free 20-minute intro. No payment required. Book one from the
          Explore Careers page.
        </p>
        <Link
          to="/student/explore-careers"
          className="inline-block bg-white text-primary text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors mt-4"
        >
          Find a professional →
        </Link>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border p-6">
          <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">PRO</span>
          <p className="text-2xl font-bold text-primary mt-3">RWF 5,000</p>
          <p className="text-xs text-muted">per session</p>
          <ul className="space-y-2 mt-4">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-primary">
                <span className="text-success font-bold flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <span className="inline-block mt-6 bg-border text-muted text-xs font-semibold px-3 py-1.5 rounded-full">
            Coming Soon
          </span>
        </div>

        <div className="bg-primary rounded-xl p-6 text-white">
          <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">PREMIUM</span>
          <p className="text-2xl font-bold text-white mt-3">RWF 10,000</p>
          <p className="text-xs text-white/60">per month</p>
          <ul className="space-y-2 mt-4">
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white">
                <span className="text-accent font-bold flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <span className="inline-block mt-6 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-8 bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Feature</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase">Free</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase">Pro</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase bg-accent/5">Premium</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? 'bg-surface' : 'bg-background'}>
                <td className="px-4 py-3 text-xs font-medium text-primary">{row.feature}</td>
                <td className="px-4 py-3 text-center">
                  {row.free === '—' ? (
                    <span className="text-subtle text-xs">—</span>
                  ) : (
                    <span className="text-primary text-xs">{row.free}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.pro === '—' ? (
                    <span className="text-subtle text-xs">—</span>
                  ) : (
                    <span className="text-primary text-xs">{row.pro}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center bg-accent/5">
                  {row.premium === '—' ? (
                    <span className="text-subtle text-xs">—</span>
                  ) : row.premium === 'Yes' ? (
                    <span className="text-success font-bold text-xs">✓</span>
                  ) : (
                    <span className="text-primary text-xs">{row.premium}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ALevelGetMentor
