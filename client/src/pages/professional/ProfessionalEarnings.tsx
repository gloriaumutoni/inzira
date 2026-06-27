import { useState } from 'react'
import { api } from '@/api/axios'
import useEarnings from '@/hooks/useEarnings'

const TYPE_BADGE: Record<string, string> = {
  PRO:        'bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full',
  PREMIUM:    'bg-success/10 text-success text-xs px-2 py-0.5 rounded-full',
  FREE_INTRO: 'bg-border text-muted text-xs px-2 py-0.5 rounded-full',
}

const ProfessionalEarnings = () => {
  const { earnings, loading, refetch } = useEarnings()
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)

  const balance = earnings?.availableBalance ?? 0
  const canPayout = balance >= 10000

  const handlePayout = async () => {
    if (!canPayout || payoutLoading) return
    setPayoutLoading(true)
    setPayoutSuccess(false)
    try {
      await api.post('/payments/payout')
      setPayoutSuccess(true)
      refetch()
    } catch {
    } finally {
      setPayoutLoading(false)
    }
  }

  const PayoutButton = ({ full }: { full?: boolean }) => (
    <div className="relative group inline-block">
      <button
        onClick={handlePayout}
        disabled={!canPayout || payoutLoading}
        className={`${full ? 'w-full py-2.5' : 'text-sm px-4 py-2'} bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors`}
      >
        {payoutLoading ? 'Processing…' : 'Request Payout'}
      </button>
      {!canPayout && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Minimum payout is RWF 10,000
        </span>
      )}
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Earnings</h1>
        <PayoutButton />
      </div>

      {payoutSuccess && (
        <p className="text-success text-sm mt-3">Payout request submitted successfully.</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {loading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-border rounded-xl h-24" />
            ))}
          </>
        ) : (
          <>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-2xl font-bold text-primary">
                RWF {(earnings?.totalEarnings ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Total Net Earnings</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-2xl font-bold text-primary">
                RWF {(earnings?.thisMonth ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">This Month</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-2xl font-bold text-primary">
                {earnings?.activePremiumStudents ?? 0}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Active Premium Students</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-2xl font-bold text-success">
                RWF {balance.toLocaleString()}
              </p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">Available Balance</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Breakdown table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-primary">Earnings breakdown</p>
            <select className="border border-border rounded-lg text-xs text-muted px-2 py-1 bg-surface">
              <option>All time</option>
              <option>This month</option>
              <option>Last month</option>
            </select>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-muted uppercase bg-background border-b border-border">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Student</th>
                  <th className="py-3 px-4 text-left">Details</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [0, 1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} className="py-3 px-4">
                        <div className="animate-pulse bg-border rounded h-4" />
                      </td>
                    </tr>
                  ))
                ) : !earnings?.transactions?.length ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-muted">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  earnings.transactions.map((tx, i) => (
                    <tr key={tx.id} className={i % 2 === 0 ? 'bg-surface' : 'bg-background'}>
                      <td className="py-3 px-4 text-sm text-muted">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={TYPE_BADGE[tx.type] ?? ''}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-primary">{tx.studentName}</td>
                      <td className="py-3 px-4 text-sm text-muted">{tx.details}</td>
                      <td className="py-3 px-4 text-sm text-primary text-right">
                        {tx.gross.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-error text-right">
                        -{tx.commission.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-primary font-semibold text-right">
                        {tx.net.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-5 sticky top-24">
            <p className="text-sm font-semibold text-primary">Payout</p>
            <p className="text-xs text-muted mt-3">Available Balance</p>
            <p className="text-xl font-bold text-success mt-1">
              RWF {balance.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-warning text-white text-xs px-2 py-0.5 rounded">MTN MoMo</span>
              <span className="text-xs text-muted">**** ***  245</span>
            </div>
            <PayoutButton full />
            <p className="text-xs text-muted mt-2 text-center">Next scheduled payout: Oct 31</p>

            <div className="border-t border-border mt-4 pt-4">
              <div className="bg-accent rounded-xl p-4">
                <p className="text-sm font-bold text-white">Upgrade to Premium</p>
                <p className="text-xs text-white/80 mt-1">Unlock analytics and lower commission rates.</p>
                <button className="bg-white text-accent text-xs px-3 py-1.5 rounded-lg mt-3 hover:bg-white/90 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalEarnings
