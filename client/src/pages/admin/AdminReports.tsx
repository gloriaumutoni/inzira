import { useState } from 'react'
import { Users, Briefcase, BookOpen, TrendingUp, Download, Video, CheckCircle } from 'lucide-react'
import {
  useReportStudentsQuery,
  useReportProfessionalsQuery,
  useReportCareerGuidesQuery,
  useReportSummaryQuery,
  useAdminStatsQuery,
  fetchAllReportStudents,
  fetchAllReportProfessionals,
  fetchAllReportCareerGuides,
  type ReportStudent,
  type ReportProfessional,
  type ReportCareerGuide,
  type MentorSession,
  type GroupSessionItem,
} from '@/hooks/queries/adminQueries'
import { exportTableToPdf, type PdfColumn } from '@/utils/exportPdf'
import { toast } from '@/utils/toast'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Now'
  const m = Math.floor(diff / 60000)
  if (m < 60) return `In ${m} min${m === 1 ? '' : 's'}`
  const h = Math.floor(m / 60)
  if (h < 24) return `In ${h} hour${h === 1 ? '' : 's'}`
  const d = Math.floor(h / 24)
  return `In ${d} day${d === 1 ? '' : 's'}`
}

function sessionIcon(_type: string) {
  return <Video size={14} />
}

function sessionIconBg(_type: string): string {
  return 'bg-accent/20 text-accent'
}

function statusBadge(status: string): string {
  if (status === 'COMPLETED') return 'bg-success/10 text-success'
  if (status === 'CONFIRMED') return 'bg-accent/10 text-accent'
  if (status === 'CANCELLED') return 'bg-error/10 text-error'
  if (status === 'RESCHEDULED') return 'bg-warning/10 text-warning'
  return 'bg-border text-muted'
}

const Paginator = ({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) => (
  <div className="flex items-center gap-2 mt-4 justify-end print:hidden">
    <button
      onClick={() => onPage(page - 1)}
      disabled={page <= 1}
      className="px-3 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-background transition-colors"
    >
      Prev
    </button>
    <span className="text-sm text-muted">
      {page} / {totalPages}
    </span>
    <button
      onClick={() => onPage(page + 1)}
      disabled={page >= totalPages}
      className="px-3 py-1 text-sm border border-border rounded disabled:opacity-30 hover:bg-background transition-colors"
    >
      Next
    </button>
  </div>
)

const ROW_KEYS = ['r0', 'r1', 'r2', 'r3', 'r4'] as const
const COL_KEYS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const

const SkeletonRows = ({ cols }: { cols: number }) => (
  <tbody>
    {ROW_KEYS.map((rk) => (
      <tr key={rk}>
        {COL_KEYS.slice(0, cols).map((ck) => (
          <td key={ck} className="py-3 pr-4">
            <div className="animate-pulse bg-border rounded h-4 w-full" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
)

const StudentsSection = () => {
  const [level, setLevel] = useState<'A_LEVEL' | 'O_LEVEL'>('O_LEVEL')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const { data: result, isLoading: loading, isError } = useReportStudentsQuery(level, page)
  const data = result?.data ?? []
  const total = result?.total ?? 0
  const totalPages = result?.totalPages ?? 1
  const error = isError ? 'Failed to load data. Please try again.' : null

  const handleLevel = (l: 'A_LEVEL' | 'O_LEVEL') => {
    setLevel(l)
    setPage(1)
    setSearch('')
  }

  const matchesSearch = (s: ReportStudent) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.school ?? '').toLowerCase().includes(search.toLowerCase())

  const filtered = search ? data.filter(matchesSearch) : data

  const cols = level === 'A_LEVEL' ? 5 : 4

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await fetchAllReportStudents(level)
      const rows = search ? all.filter(matchesSearch) : all

      const columns: PdfColumn<ReportStudent>[] = [
        { header: 'Name', accessor: (s) => `${s.firstName} ${s.lastName}` },
        { header: 'School', accessor: (s) => s.school ?? '—' },
      ]
      if (level === 'A_LEVEL') {
        columns.push({ header: 'Combination', accessor: (s) => s.combination ?? '—' })
      }
      columns.push(
        { header: 'Sessions', accessor: (s) => s.sessionCount },
        { header: 'Joined', accessor: (s) => fmtDate(s.createdAt) },
      )

      exportTableToPdf({
        title: `${level === 'A_LEVEL' ? 'A-Level' : 'O-Level'} Students Report`,
        subtitle: `${rows.length} student${rows.length === 1 ? '' : 's'}${search ? ` · filtered by "${search}"` : ''}`,
        columns,
        rows,
        filename: `students-${level.toLowerCase()}-${Date.now()}.pdf`,
      })
    } catch {
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-primary">Students</h2>
          <p className="text-xs text-muted mt-0.5">{total} total</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 print:hidden w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search name or school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm w-full sm:w-48 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-1 bg-background rounded-lg p-1">
            {(['A_LEVEL', 'O_LEVEL'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLevel(l)}
                className={
                  level === l
                    ? 'bg-surface shadow-sm text-primary text-sm px-3 py-1 rounded-md font-medium'
                    : 'text-muted text-sm px-3 py-1'
                }
              >
                {l === 'A_LEVEL' ? 'A-Level' : 'O-Level'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-background transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">School</th>
              {level === 'A_LEVEL' && (
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Combination</th>
              )}
              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Sessions</th>
              <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows cols={cols} />
          ) : (
            <tbody>
              {error && (
                <tr>
                  <td colSpan={cols} className="py-8 text-center text-sm text-error">
                    {error}
                  </td>
                </tr>
              )}
              {!error && filtered.length === 0 && (
                <tr>
                  <td colSpan={cols} className="py-8 text-center text-sm text-muted">
                    No students found.
                  </td>
                </tr>
              )}
              {!error && filtered.map((s: ReportStudent) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background/50">
                  <td className="py-3 pr-4 font-medium text-primary">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-3 pr-4 text-muted">{s.school ?? '—'}</td>
                  {level === 'A_LEVEL' && (
                    <td className="py-3 pr-4 text-muted">{s.combination ?? '—'}</td>
                  )}
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.sessionCount > 0
                          ? 'bg-success/10 text-success'
                          : 'bg-border text-muted'
                      }`}
                    >
                      {s.sessionCount}
                    </span>
                  </td>
                  <td className="py-3 text-muted text-xs">{fmtDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
      {!loading && totalPages > 1 && (
        <Paginator page={page} totalPages={totalPages} onPage={setPage} />
      )}
    </div>
  )
}

type ProCategory = 'professional' | 'mentor' | 'career-guide'
type ProStatus = 'approved' | 'rejected'

const PRO_CATEGORIES: { value: ProCategory; label: string }[] = [
  { value: 'professional', label: 'Professionals' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'career-guide', label: 'Career Guides' },
]

const HEADING: Record<ProCategory, Record<ProStatus, string>> = {
  professional: { approved: 'Approved Professionals', rejected: 'Rejected Professionals' },
  mentor: { approved: 'Approved Mentors', rejected: 'Rejected Mentors' },
  'career-guide': { approved: 'Approved Career Guides', rejected: 'Rejected Career Guides' },
}

const EMPTY_MSG: Record<ProCategory, Record<ProStatus, string>> = {
  professional: { approved: 'No approved professionals.', rejected: 'No rejected professionals.' },
  mentor: { approved: 'No approved mentors.', rejected: 'No rejected mentors.' },
  'career-guide': { approved: 'No approved career guides.', rejected: 'No rejected career guides.' },
}

function proFetchType(category: ProCategory, status: ProStatus): 'professional' | 'mentor' | 'rejected' | 'mentor-rejected' {
  if (category === 'professional') return status === 'approved' ? 'professional' : 'rejected'
  if (category === 'mentor') return status === 'approved' ? 'mentor' : 'mentor-rejected'
  return 'professional'
}

const ProfessionalsSection = () => {
  const [category, setCategory] = useState<ProCategory>('professional')
  const [status, setStatus] = useState<ProStatus>('approved')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const isGuide = category === 'career-guide'

  const proQuery = useReportProfessionalsQuery(proFetchType(category, status), page)
  const cgQuery = useReportCareerGuidesQuery(page, status)

  const proData = proQuery.data?.data ?? []
  const proTotal = proQuery.data?.total ?? 0
  const proTotalPages = proQuery.data?.totalPages ?? 1
  const proLoading = proQuery.isLoading
  const proError = proQuery.isError ? 'Failed to load data. Please try again.' : null

  const cgData = cgQuery.data?.data ?? []
  const cgTotal = cgQuery.data?.total ?? 0
  const cgTotalPages = cgQuery.data?.totalPages ?? 1
  const cgLoading = cgQuery.isLoading
  const cgError = cgQuery.isError ? 'Failed to load data. Please try again.' : null

  const total = isGuide ? cgTotal : proTotal
  const totalPages = isGuide ? cgTotalPages : proTotalPages
  const loading = isGuide ? cgLoading : proLoading

  const handleCategory = (c: ProCategory) => { setCategory(c); setPage(1); setSearch('') }
  const handleStatus = (s: ProStatus) => { setStatus(s); setPage(1); setSearch('') }

  const filteredPro = search
    ? proData.filter(
        (p: ReportProfessional) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          p.sector.toLowerCase().includes(search.toLowerCase()) ||
          p.employer.toLowerCase().includes(search.toLowerCase()),
      )
    : proData

  const filteredCg = search
    ? cgData.filter(
        (g: ReportCareerGuide) =>
          `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (g.school?.name ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : cgData

  const handleExport = async () => {
    setExporting(true)
    try {
      if (isGuide) {
        const all = await fetchAllReportCareerGuides(status)
        const rows = search
          ? all.filter(
              (g) =>
                `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                (g.school?.name ?? '').toLowerCase().includes(search.toLowerCase()),
            )
          : all

        const columns: PdfColumn<ReportCareerGuide>[] = [
          { header: 'Name', accessor: (g) => `${g.firstName} ${g.lastName}` },
          { header: 'Email', accessor: (g) => g.email },
          { header: 'School', accessor: (g) => g.school?.name ?? '—' },
          { header: 'District', accessor: (g) => g.school?.district ?? '—' },
          { header: status === 'approved' ? 'Verified Since' : 'Joined', accessor: (g) => fmtDate(g.createdAt) },
        ]

        exportTableToPdf({
          title: `${HEADING[category][status]} Report`,
          subtitle: `${rows.length} career guide${rows.length === 1 ? '' : 's'}${search ? ` · filtered by "${search}"` : ''}`,
          columns,
          rows,
          filename: `career-guides-${status}-${Date.now()}.pdf`,
        })
      } else {
        const all = await fetchAllReportProfessionals(proFetchType(category, status))
        const rows = search
          ? all.filter(
              (p) =>
                `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                p.sector.toLowerCase().includes(search.toLowerCase()) ||
                p.employer.toLowerCase().includes(search.toLowerCase()),
            )
          : all

        const columns: PdfColumn<ReportProfessional>[] = [
          { header: 'Name', accessor: (p) => `${p.firstName} ${p.lastName}` },
          { header: 'Email', accessor: (p) => p.email },
          { header: 'Title', accessor: (p) => p.jobTitle },
          { header: 'Employer', accessor: (p) => p.employer },
          { header: 'Sector', accessor: (p) => p.sector },
          { header: 'Completed', accessor: (p) => p.completedSessions },
          { header: 'Upcoming', accessor: (p) => p.upcomingSessions },
          { header: 'Joined', accessor: (p) => fmtDate(p.createdAt) },
        ]

        exportTableToPdf({
          title: `${HEADING[category][status]} Report`,
          subtitle: `${rows.length} ${category === 'mentor' ? 'mentor' : 'professional'}${rows.length === 1 ? '' : 's'}${search ? ` · filtered by "${search}"` : ''}`,
          columns,
          rows,
          filename: `${category}-${status}-${Date.now()}.pdf`,
        })
      }
    } catch {
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-semibold text-primary">{HEADING[category][status]}</h2>
          <p className="text-xs text-muted mt-0.5">{total} total</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 print:hidden w-full sm:w-auto">
          <input
            type="text"
            placeholder={isGuide ? 'Search name or school…' : 'Search name, sector…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm w-full sm:w-48 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-background transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Category + status toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {PRO_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategory(c.value)}
              className={
                category === c.value
                  ? 'bg-surface shadow-sm text-primary text-sm px-3 py-1 rounded-md font-medium'
                  : 'text-muted text-sm px-3 py-1'
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {(['approved', 'rejected'] as const).map((s) => {
            const activeClass = s === 'approved'
              ? 'bg-success/10 text-success text-sm px-3 py-1 rounded-md font-medium shadow-sm'
              : 'bg-error/10 text-error text-sm px-3 py-1 rounded-md font-medium shadow-sm'
            return (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={status === s ? activeClass : 'text-muted text-sm px-3 py-1'}
            >
              {s === 'approved' ? 'Approved' : 'Rejected'}
            </button>
          )})}

        </div>
      </div>

      {isGuide ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">School</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">District</th>
                <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  {status === 'approved' ? 'Verified Since' : 'Joined'}
                </th>
              </tr>
            </thead>
            {cgLoading ? (
              <SkeletonRows cols={4} />
            ) : (
              <tbody>
                {cgError && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-error">{cgError}</td></tr>
                )}
                {!cgError && filteredCg.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-muted">{EMPTY_MSG[category][status]}</td></tr>
                )}
                {!cgError && filteredCg.map((g: ReportCareerGuide) => (
                  <tr key={g.id} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-primary">{g.firstName} {g.lastName}</p>
                      <p className="text-xs text-muted">{g.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">{g.school?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-muted">{g.school?.district ?? '—'}</td>
                    <td className="py-3 text-muted text-xs">{fmtDate(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Title / Employer</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Sector</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Past Sessions</th>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-muted uppercase tracking-wide">Upcoming</th>
                <th className="text-left py-2 text-xs font-semibold text-muted uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            {proLoading ? (
              <SkeletonRows cols={6} />
            ) : (
              <tbody>
                {proError && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-error">{proError}</td></tr>
                )}
                {!proError && filteredPro.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted">
                      {EMPTY_MSG[category][status]}
                    </td>
                  </tr>
                )}
                {!proError && filteredPro.map((p: ReportProfessional) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-primary">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-muted">{p.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      <p>{p.jobTitle}</p>
                      <p className="text-xs">{p.employer}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">{p.sector}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/10 text-success">
                        {p.completedSessions}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.upcomingSessions > 0 ? 'bg-accent/10 text-accent' : 'bg-border text-muted'}`}>
                        {p.upcomingSessions}
                      </span>
                    </td>
                    <td className="py-3 text-muted text-xs">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Paginator page={page} totalPages={totalPages} onPage={setPage} />
      )}
    </div>
  )
}

const SessionsSection = () => {
  const { data: stats, isLoading: loading, isError: error } = useAdminStatsQuery()
  const [sessionTab, setSessionTab] = useState<'upcoming' | 'recent'>('upcoming')
  const [sessionType, setSessionType] = useState<'mentor' | 'group'>('mentor')

  const activeMentorSessions: MentorSession[] =
    sessionTab === 'upcoming'
      ? (stats?.upcomingMentorSessions ?? [])
      : (stats?.recentMentorSessions ?? [])

  const activeGroupSessions: GroupSessionItem[] =
    sessionTab === 'upcoming'
      ? (stats?.upcomingGroupSessions ?? [])
      : (stats?.recentGroupSessions ?? [])

  const handleExport = () => {
    const tabLabel = sessionTab === 'upcoming' ? 'Upcoming' : 'Recent'

    if (sessionType === 'mentor') {
      const columns: PdfColumn<MentorSession>[] = [
        { header: 'Student', accessor: (s) => s.studentName },
        { header: 'School', accessor: (s) => s.school ?? '—' },
        { header: 'Grade', accessor: (s) => s.grade },
        { header: 'Scheduled', accessor: (s) => fmtDate(s.scheduledAt) },
        { header: 'Status', accessor: (s) => s.status },
      ]
      exportTableToPdf({
        title: `${tabLabel} Mentor Sessions`,
        subtitle: `${activeMentorSessions.length} session${activeMentorSessions.length === 1 ? '' : 's'}`,
        columns,
        rows: activeMentorSessions,
        filename: `mentor-sessions-${sessionTab}-${Date.now()}.pdf`,
      })
    } else {
      const columns: PdfColumn<GroupSessionItem>[] = [
        { header: 'Title', accessor: (g) => g.title },
        { header: 'Sector', accessor: (g) => g.sector },
        { header: 'Enrolled', accessor: (g) => g.enrolmentCount },
        { header: 'Scheduled', accessor: (g) => fmtDate(g.scheduledAt) },
      ]
      exportTableToPdf({
        title: `${tabLabel} Group Sessions`,
        subtitle: `${activeGroupSessions.length} session${activeGroupSessions.length === 1 ? '' : 's'}`,
        columns,
        rows: activeGroupSessions,
        filename: `group-sessions-${sessionTab}-${Date.now()}.pdf`,
      })
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-primary">Sessions</h2>
          <p className="text-xs text-muted mt-0.5">Upcoming and recent mentor and group sessions.</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <div className="flex gap-1 bg-background rounded-lg p-1">
            {(['upcoming', 'recent'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSessionTab(t)}
                className={
                  sessionTab === t
                    ? 'bg-surface shadow-sm text-primary text-sm px-4 py-1.5 rounded-md font-medium'
                    : 'text-muted text-sm px-4 py-1.5'
                }
              >
                {t === 'upcoming' ? 'Upcoming' : 'Recent'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-background rounded-lg p-1">
            {(['mentor', 'group'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className={
                  sessionType === t
                    ? 'bg-surface shadow-sm text-primary text-sm px-4 py-1.5 rounded-md font-medium'
                    : 'text-muted text-sm px-4 py-1.5'
                }
              >
                {t === 'mentor' ? 'Mentor Sessions' : 'Group Sessions'}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-background transition-colors"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-border rounded h-12" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-error py-4">Failed to load sessions.</p>
      ) : sessionType === 'mentor' ? (
        activeMentorSessions.length === 0 ? (
          <p className="text-sm text-muted py-4">No {sessionTab} mentor sessions.</p>
        ) : (
          <div>
            {activeMentorSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sessionIconBg(s.type)}`}>
                  {sessionIcon(s.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">{s.studentName}</p>
                  <p className="text-xs text-muted">{s.school ? `${s.school} · ` : ''}{s.grade}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">
                    {sessionTab === 'upcoming' ? timeUntil(s.scheduledAt) : timeAgo(s.scheduledAt)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge(s.status)}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        activeGroupSessions.length === 0 ? (
          <p className="text-sm text-muted py-4">No {sessionTab} group sessions.</p>
        ) : (
          <div>
            {activeGroupSessions.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-accent/20 text-accent">
                  <Users size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{g.title}</p>
                  <p className="text-xs text-muted">{g.sector} · {g.enrolmentCount} enrolled</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted">
                    {sessionTab === 'upcoming' ? timeUntil(g.scheduledAt) : timeAgo(g.scheduledAt)}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block bg-accent/10 text-accent">
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

const AdminReports = () => {
  const { data: summary, isLoading: summaryLoading } = useReportSummaryQuery()

  const engagementPct = summary
    ? Math.round((summary.engagingStudents / Math.max(summary.totalStudents, 1)) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">Platform Reports</h1>
        <p className="text-sm text-muted mt-1">
          Full overview of students, professionals, and platform activity.
        </p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['s0', 's1', 's2', 's3'] as const).map((k) => (
            <div key={k} className="animate-pulse bg-border rounded-xl h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              Icon: Users,
              bg: 'bg-accent/10',
              color: 'text-accent',
              value: summary?.totalStudents ?? 0,
              label: 'Total Students',
              sub: null,
            },
            {
              Icon: TrendingUp,
              bg: 'bg-success/10',
              color: 'text-success',
              value: summary?.engagingStudents ?? 0,
              label: 'Engaging Students',
              sub: `${engagementPct}% of total`,
            },
            {
              Icon: BookOpen,
              bg: 'bg-warning/10',
              color: 'text-warning',
              value: summary?.totalSessions ?? 0,
              label: 'Total Sessions',
              sub: null,
            },
            {
              Icon: Briefcase,
              bg: 'bg-primary/10',
              color: 'text-primary',
              value: `${summary?.completionRate ?? 0}%`,
              label: 'Completion Rate',
              sub: `${summary?.completedSessions ?? 0} completed`,
            },
          ].map(({ Icon, bg, color, value, label, sub }) => (
            <div key={label} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  {sub && <p className="text-xs text-success mt-0.5">{sub}</p>}
                  <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StudentsSection />
      <ProfessionalsSection />
      <SessionsSection />
    </div>
  )
}

export default AdminReports
