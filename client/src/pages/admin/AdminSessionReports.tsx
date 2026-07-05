import { useState, useEffect } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, ShieldOff, ShieldCheck } from 'lucide-react'
import { api } from '@/api/axios'

type ReportReason = 'INAPPROPRIATE_BEHAVIOUR' | 'UNCOMFORTABLE_CONTENT' | 'NO_SHOW' | 'HARASSMENT' | 'OTHER'
type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'

interface ReportedProfessional {
  id: string
  firstName: string
  lastName: string
  isActive: boolean
}

interface SessionReport {
  id: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  createdAt: string
  session?: {
    id: string
    scheduledAt: string
    student: { firstName: string; lastName: string }
    professional: ReportedProfessional
  }
  groupSession?: {
    id: string
    title: string
    scheduledAt: string
    professional: ReportedProfessional
  }
  reporter: { id: string; email: string; student?: { firstName: string; lastName: string } | null }
}

const REASON_LABELS: Record<ReportReason, string> = {
  INAPPROPRIATE_BEHAVIOUR: 'Inappropriate behaviour',
  UNCOMFORTABLE_CONTENT:   'Uncomfortable content',
  NO_SHOW:                 'No-show',
  HARASSMENT:              'Harassment',
  OTHER:                   'Other',
}

const STATUS_OPTIONS: ReportStatus[] = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING:      'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  RESOLVED:     'bg-green-100 text-green-800',
  DISMISSED:    'bg-gray-100 text-gray-500',
}

const STATUS_FILTER_TABS: { key: ReportStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',          label: 'All' },
  { key: 'PENDING',      label: 'Pending' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'RESOLVED',     label: 'Resolved' },
  { key: 'DISMISSED',    label: 'Dismissed' },
]

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

function ReportRow({ report, onStatusChange, onSuspendToggle }: Readonly<{
  report: SessionReport
  onStatusChange: (id: string, status: ReportStatus) => Promise<void>
  onSuspendToggle: (professionalId: string, suspend: boolean) => Promise<void>
}>) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [togglingSuspend, setTogglingSuspend] = useState(false)

  const sessionDate = report.session?.scheduledAt ?? report.groupSession?.scheduledAt

  let studentName: string
  if (report.session) {
    studentName = `${report.session.student.firstName} ${report.session.student.lastName}`
  } else if (report.reporter.student) {
    studentName = `${report.reporter.student.firstName} ${report.reporter.student.lastName}`
  } else {
    studentName = report.reporter.email
  }

  const professional = report.session?.professional ?? report.groupSession?.professional
  const professionalName = professional ? `${professional.firstName} ${professional.lastName}` : '—'

  const sessionLabel = report.groupSession ? `Group: ${report.groupSession.title}` : '1-on-1'

  const handleStatus = async (status: ReportStatus) => {
    setUpdating(true)
    try { await onStatusChange(report.id, status) } finally { setUpdating(false) }
  }

  const handleSuspendToggle = async () => {
    if (!professional) return
    setTogglingSuspend(true)
    try { await onSuspendToggle(professional.id, professional.isActive) } finally { setTogglingSuspend(false) }
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-background transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
          <span className="text-sm text-primary font-medium">{sessionDate ? fmtDate(sessionDate) : '—'}</span>
          <span className="text-sm text-foreground">{studentName}</span>
          <span className="text-sm text-foreground hidden md:block">{professionalName}</span>
          <span className="text-sm text-muted hidden md:block">
            <span className="bg-primary/5 text-primary text-xs px-2 py-0.5 rounded-full mr-1">{sessionLabel}</span>
            {REASON_LABELS[report.reason]}
          </span>
          <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_STYLES[report.status]}`}>
            {report.status.replace('_', ' ')}
          </span>
        </div>
        <span className="text-muted flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-background">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Student</p>
              <p className="text-foreground">{studentName}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Professional</p>
              <p className="text-foreground">{professionalName}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Session date</p>
              <p className="text-foreground">{sessionDate ? fmtDate(sessionDate) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Session type</p>
              <p className="text-foreground">{sessionLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Reason</p>
              <p className="text-foreground">{REASON_LABELS[report.reason]}</p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Submitted</p>
              <p className="text-foreground">{fmtDate(report.createdAt)}</p>
            </div>
          </div>

          {report.description && (
            <div>
              <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Details</p>
              <p className="text-sm text-foreground leading-relaxed bg-surface border border-border rounded-lg p-3">
                {report.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <label htmlFor={`status-${report.id}`} className="text-xs text-muted font-semibold uppercase tracking-wide flex-shrink-0">
              Update status
            </label>
            <select
              id={`status-${report.id}`}
              value={report.status}
              disabled={updating}
              onChange={e => handleStatus(e.target.value as ReportStatus)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-primary focus:outline-none focus:border-primary disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {professional && (
              <button
                onClick={handleSuspendToggle}
                disabled={togglingSuspend}
                className={[
                  'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50',
                  professional.isActive
                    ? 'border-error/30 text-error hover:bg-error/5'
                    : 'border-success/30 text-success hover:bg-success/5',
                ].join(' ')}
              >
                {professional.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                {professional.isActive ? 'Suspend professional' : 'Reinstate professional'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AdminSessionReports = () => {
  const [reports, setReports] = useState<SessionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTab, setFilterTab] = useState<ReportStatus | 'ALL'>('ALL')

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = filterTab === 'ALL' ? '' : `?status=${filterTab}`
      const { data } = await api.get(`/admin/session-reports${params}`)
      setReports(data.data ?? [])
    } catch {
      setError('Could not load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [filterTab])

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    await api.patch(`/admin/session-reports/${id}`, { status })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const handleSuspendToggle = async (professionalId: string, currentlyActive: boolean) => {
    await api.patch(`/admin/professionals/${professionalId}/${currentlyActive ? 'suspend' : 'reinstate'}`)
    setReports(prev => prev.map(r => {
      if (r.session?.professional.id === professionalId) {
        return { ...r, session: { ...r.session, professional: { ...r.session.professional, isActive: !currentlyActive } } }
      }
      if (r.groupSession?.professional.id === professionalId) {
        return { ...r, groupSession: { ...r.groupSession, professional: { ...r.groupSession.professional, isActive: !currentlyActive } } }
      }
      return r
    }))
  }

  const SKELETON_KEYS = ['a', 'b', 'c', 'd']

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {SKELETON_KEYS.map(k => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-16" />
          ))}
        </div>
      )
    }
    if (reports.length === 0) {
      return (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-success mx-auto mb-3" />
          <p className="text-sm font-semibold text-primary">No reports</p>
          <p className="text-xs text-muted mt-1">No session reports match this filter.</p>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted">{reports.length} report{reports.length === 1 ? '' : 's'}</p>
        {reports.map(r => (
          <ReportRow key={r.id} report={r} onStatusChange={handleStatusChange} onSuspendToggle={handleSuspendToggle} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Session Reports</h1>
        <p className="text-sm text-muted mt-0.5">Safety concerns reported by students about their sessions</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {STATUS_FILTER_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              filterTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error/5 border border-error/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  )
}

export default AdminSessionReports
