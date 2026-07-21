import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useStudentSessions, { StudentSession } from '@/hooks/useStudentSessions'
// TODO: reflection flow paused — usePendingReflections + PostSessionReflectionModal hidden (not deleted)
import { api } from '@/api/axios'
import { STREAMS, combinationToStream, type StreamCode } from '@/constants/streams'

type ReportReason = 'INAPPROPRIATE_BEHAVIOUR' | 'UNCOMFORTABLE_CONTENT' | 'NO_SHOW' | 'HARASSMENT' | 'OTHER'

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'INAPPROPRIATE_BEHAVIOUR', label: 'Inappropriate behaviour' },
  { value: 'UNCOMFORTABLE_CONTENT',   label: 'Uncomfortable content' },
  { value: 'NO_SHOW',                 label: 'No-show' },
  { value: 'HARASSMENT',              label: 'Harassment' },
  { value: 'OTHER',                   label: 'Other' },
]

function ReportModal({ sessionId, sessionType, onClose }: Readonly<{
  sessionId: string
  sessionType: 'session' | 'group-session'
  onClose: () => void
}>) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      await api.post(`/${sessionType === 'session' ? 'sessions' : 'group-sessions'}/${sessionId}/report`, {
        reason,
        description: description.trim() || undefined,
      })
      setDone(true)
    } catch {
      // fail silently — keep modal open
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4">
        {done ? (
          <>
            <h3 className="text-sm font-semibold text-primary">Report received</h3>
            <p className="text-sm text-muted">Your report has been received. Our team will review it shortly.</p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-primary">Report a concern</h3>
            <p className="text-xs text-muted">Your report is confidential and will be reviewed by our safety team.</p>
            <div className="space-y-1">
              <label htmlFor="report-reason" className="text-xs font-medium text-foreground">Reason</label>
              <select
                id="report-reason"
                value={reason}
                onChange={e => setReason(e.target.value as ReportReason)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select a reason…</option>
                {REPORT_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="report-description" className="text-xs font-medium text-foreground">Details (optional)</label>
              <textarea
                id="report-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what happened…"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!reason || submitting}
                onClick={handleSubmit}
                className="text-sm px-4 py-2 rounded-lg bg-error text-white disabled:opacity-50 hover:bg-error/90 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface GroupSession {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  sector: string
  streamCodes?: string[]
  combinations: string[]
  maxStudents: number
  joinLink?: string
  professional: { id: string; firstName: string; lastName: string; jobTitle?: string }
  _count: { enrolments: number }
}

interface MentorSlot {
  id: string
  scheduledAt: string
  durationMins: number
  meetLink: string | null
  Professional: { id: string; firstName: string; lastName: string; jobTitle: string }
}

const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
const SKELETON_KEYS = ['sk1', 'sk2', 'sk3', 'sk4']

const TabBar = ({ tabs, active, onChange }: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) => (
  <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 w-fit">
    {tabs.map(t => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={active === t
          ? 'bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium'
          : 'text-muted hover:text-primary px-4 py-2 rounded-lg text-sm transition-colors'
        }
      >
        {t}
      </button>
    ))}
  </div>
)

const SkeletonGrid = () => (
  <div className={GRID}>
    {SKELETON_KEYS.map(k => (
      <div key={k} className="animate-pulse bg-border rounded-xl h-36" />
    ))}
  </div>
)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

const StudentSessions = () => {
  const { user } = useAuth()
  const { sessions, loading: sessionsLoading } = useStudentSessions()
  // TODO: reflection flow paused

  const careerInterests = user?.student?.careerInterests ?? []

  const [categoryTab, setCategoryTab] = useState<'Group Sessions' | 'Mentor Sessions'>('Group Sessions')
  const [timeTab, setTimeTab] = useState<'Upcoming' | 'Past'>('Upcoming')
  const [relevantOnly, setRelevantOnly] = useState(careerInterests.length > 0)

  const [upcomingGs, setUpcomingGs] = useState<GroupSession[]>([])
  const [pastEnrolledGs, setPastEnrolledGs] = useState<GroupSession[]>([])
  const [enrolledUpcomingCount, setEnrolledUpcomingCount] = useState(0)
  const [gsLoading, setGsLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set())
  const [selectedStreams, setSelectedStreams] = useState<Set<StreamCode>>(new Set())

  const [mentorSlots, setMentorSlots] = useState<MentorSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)

  const [reportTarget, setReportTarget] = useState<{ id: string; type: 'session' | 'group-session' } | null>(null)

  const activeSectors = relevantOnly && careerInterests.length > 0
    ? careerInterests.join(',')
    : undefined

  const fetchGroupData = useCallback(async () => {
    setGsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (activeSectors) params.set('sectors', activeSectors)
      const [gsRes, enrollRes] = await Promise.all([
        api.get(`/group-sessions?${params}`),
        api.get('/students/me/group-sessions'),
      ])
      const available: GroupSession[] = gsRes.data.data.sessions ?? []
      const enrolments: { id: string; groupSession: GroupSession }[] = enrollRes.data.data.enrolments ?? []

      const enrolled = enrolments.map(e => e.groupSession)
      const ids = new Set<string>(enrolments.map(e => e.groupSession.id))
      const now = new Date()

      setUpcomingGs(available.filter(g => new Date(g.scheduledAt) > now && !ids.has(g.id)))
      setPastEnrolledGs(enrolled.filter(g => new Date(g.scheduledAt) <= now))
      setEnrolledUpcomingCount(enrolled.filter(g => new Date(g.scheduledAt) > now).length)
    } catch {
      // fail silently
    } finally {
      setGsLoading(false)
    }
  }, [activeSectors])

  useEffect(() => { fetchGroupData() }, [fetchGroupData])

  useEffect(() => {
    api.get('/students/me/mentor-slots')
      .then(({ data }) => setMentorSlots(data.data.slots ?? []))
      .catch(() => {})
      .finally(() => setSlotsLoading(false))
  }, [])

  const handleEnrol = async (sessionId: string) => {
    setEnrolling(sessionId)
    try {
      await api.post(`/group-sessions/${sessionId}/enrol`)
      await fetchGroupData()
    } catch {
      // fail silently
    } finally {
      setEnrolling(null)
    }
  }

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev => {
      const next = new Set(prev)
      if (next.has(sector)) next.delete(sector)
      else next.add(sector)
      return next
    })
  }

  const toggleStream = (code: StreamCode) => {
    setSelectedStreams(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const renderEnrollButton = (gs: GroupSession) => {
    const isPending = enrolling === gs.id
    if (enrolledUpcomingCount >= 3) {
      return (
        <div className="relative group mt-auto pt-2">
          <button
            disabled
            className="w-full bg-border text-muted text-xs px-3 py-1.5 rounded-lg opacity-60 cursor-not-allowed"
          >
            Enroll
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            Enrolled in 3 sessions — opt out of one to join another
          </div>
        </div>
      )
    }
    return (
      <div className="mt-auto pt-2">
        <button
          onClick={() => handleEnrol(gs.id)}
          disabled={isPending}
          className="w-full bg-accent text-white text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Joining...' : 'Join for free'}
        </button>
      </div>
    )
  }

  const renderGroupCard = (gs: GroupSession) => (
    <div key={gs.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
      <p className="text-sm font-semibold text-primary leading-tight">{gs.title}</p>
      {gs.description && (
        <p className="text-xs text-muted line-clamp-2">{gs.description}</p>
      )}
      <p className="text-xs text-muted">{gs.professional.firstName} {gs.professional.lastName}</p>
      <p className="text-xs text-muted">{fmtDate(gs.scheduledAt)} · {fmtTime(gs.scheduledAt)}</p>
      <p className="text-xs text-muted">{gs._count.enrolments}/{gs.maxStudents} enrolled</p>
      {gs.sector && (
        <span className="self-start text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{gs.sector}</span>
      )}
      {gs.combinations?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {gs.combinations.slice(0, 3).map(c => (
            <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c}</span>
          ))}
        </div>
      )}
      {gs.joinLink && (
        <a href={gs.joinLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
          Join ↗
        </a>
      )}
      {renderEnrollButton(gs)}
    </div>
  )

  const renderPastGroupCard = (gs: GroupSession) => (
    <div key={gs.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
      <p className="text-sm font-semibold text-primary">{gs.title}</p>
      <p className="text-xs text-muted">{gs.professional.firstName} {gs.professional.lastName}</p>
      <p className="text-xs text-muted">{fmtDate(gs.scheduledAt)} · {fmtTime(gs.scheduledAt)}</p>
      {gs.sector && (
        <span className="self-start text-xs bg-border text-muted px-2 py-0.5 rounded-full">{gs.sector}</span>
      )}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs bg-border text-muted px-2 py-0.5 rounded-full font-medium">Attended</span>
        <button
          onClick={() => setReportTarget({ id: gs.id, type: 'group-session' })}
          className="text-xs text-muted hover:text-error transition-colors"
        >
          Report a concern
        </button>
      </div>
    </div>
  )

  const renderMentorSlotCard = (slot: MentorSlot) => {
    const pro = slot.Professional
    const initials = `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase()
    return (
      <div key={slot.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{pro.firstName} {pro.lastName}</p>
            <p className="text-xs text-muted truncate">{pro.jobTitle}</p>
          </div>
        </div>
        <p className="text-xs text-muted">{fmtDate(slot.scheduledAt)} · {fmtTime(slot.scheduledAt)} · {slot.durationMins} min</p>
        {slot.meetLink && (
          <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
            Join ↗
          </a>
        )}
        <span className="self-start text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium mt-auto">Confirmed</span>
      </div>
    )
  }

  const renderPastMentorCard = (s: StudentSession) => {
    const pro = s.professional
    const initials = pro ? `${pro.firstName[0] ?? ''}${pro.lastName[0] ?? ''}`.toUpperCase() : '?'
    const statusColor = s.status === 'CANCELLED' ? 'bg-error/10 text-error' : 'bg-border text-muted'
    return (
      <div key={s.id} className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">
              {pro ? `${pro.firstName} ${pro.lastName}` : 'Session'}
            </p>
            {pro?.jobTitle && <p className="text-xs text-muted truncate">{pro.jobTitle}</p>}
          </div>
        </div>
        <p className="text-xs text-muted">{fmtDate(s.scheduledAt)} · {fmtTime(s.scheduledAt)} · {s.duration} min</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
          </span>
          {s.status === 'COMPLETED' && (
            <button
              onClick={() => setReportTarget({ id: s.id, type: 'session' })}
              className="text-xs text-muted hover:text-error transition-colors"
            >
              Report a concern
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderGroupContent = () => {
    if (gsLoading) return <SkeletonGrid />

    if (timeTab === 'Past') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted">Sessions you were enrolled in that have already taken place.</p>
          {pastEnrolledGs.length === 0 && <p className="text-sm text-muted">No past group sessions yet.</p>}
          {pastEnrolledGs.length > 0 && <div className={GRID}>{pastEnrolledGs.map(gs => renderPastGroupCard(gs))}</div>}
        </div>
      )
    }

    const allSectors = [...new Set(upcomingGs.map(g => g.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b))

    let filtered = upcomingGs
    if (!relevantOnly && selectedSectors.size > 0) {
      filtered = filtered.filter(g => selectedSectors.has(g.sector))
    }
    if (selectedStreams.size > 0) {
      filtered = filtered.filter(g => {
        // Untagged/general sessions are relevant to everyone → always show.
        const untagged = !g.streamCodes?.length && !g.combinations?.length
        if (untagged) return true
        const byStream = g.streamCodes?.some(s => selectedStreams.has(s as StreamCode))
        const byLegacy = g.combinations?.some(c => {
          const s = combinationToStream(c)
          return s ? selectedStreams.has(s) : false
        })
        return byStream || byLegacy
      })
    }

    let emptyMsg = 'No group sessions available right now.'
    if (relevantOnly) emptyMsg = 'No sessions available for your career interests yet. Try turning off the filter.'
    else if (selectedStreams.size > 0) emptyMsg = 'No sessions match the selected stream(s).'
    else if (selectedSectors.size > 0) emptyMsg = 'No sessions match the selected careers.'

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Browse available sessions and enroll to secure your spot. You can be enrolled in up to 3 at a time.</p>
        <div className="flex flex-wrap gap-2">
          {STREAMS.map(stream => (
            <button
              key={stream.code}
              type="button"
              onClick={() => toggleStream(stream.code)}
              className={selectedStreams.has(stream.code)
                ? 'text-xs px-3 py-1 rounded-full font-medium bg-primary text-white'
                : 'text-xs px-3 py-1 rounded-full font-medium bg-surface border border-border text-muted hover:text-primary transition-colors'
              }
            >
              {stream.name}
            </button>
          ))}
        </div>
        {!relevantOnly && allSectors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allSectors.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSector(s)}
                className={selectedSectors.has(s)
                  ? 'text-xs px-3 py-1 rounded-full font-medium bg-accent text-white'
                  : 'text-xs px-3 py-1 rounded-full font-medium bg-surface border border-border text-muted hover:text-primary transition-colors'
                }
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && <p className="text-sm text-muted">{emptyMsg}</p>}
        {filtered.length > 0 && <div className={GRID}>{filtered.map(gs => renderGroupCard(gs))}</div>}
      </div>
    )
  }

  const renderMentorContent = () => {
    if (timeTab === 'Past') {
      if (sessionsLoading) return <SkeletonGrid />
      const pastMentorSessions = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED')
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted">Your completed and cancelled mentor sessions.</p>
          {pastMentorSessions.length === 0 && <p className="text-sm text-muted">No past mentor sessions yet.</p>}
          {pastMentorSessions.length > 0 && <div className={GRID}>{pastMentorSessions.map(s => renderPastMentorCard(s))}</div>}
        </div>
      )
    }

    if (slotsLoading) return <SkeletonGrid />
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">Your confirmed upcoming 1-on-1 sessions with mentors.</p>
        {mentorSlots.length === 0 && <p className="text-sm text-muted">No upcoming mentor sessions.</p>}
        {mentorSlots.length > 0 && <div className={GRID}>{mentorSlots.map(slot => renderMentorSlotCard(slot))}</div>}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {reportTarget && (
        <ReportModal
          sessionId={reportTarget.id}
          sessionType={reportTarget.type}
          onClose={() => setReportTarget(null)}
        />
      )}
      {/* TODO: reflection flow paused — PostSessionReflectionModal render removed */}
      <h1 className="text-xl font-bold text-primary">Sessions</h1>

      {careerInterests.length > 0 && categoryTab === 'Group Sessions' && timeTab === 'Upcoming' && (
        <button
          type="button"
          onClick={() => setRelevantOnly(v => !v)}
          className={relevantOnly
            ? 'text-xs px-3 py-2 rounded-lg font-medium bg-accent text-white border border-accent'
            : 'text-xs px-3 py-2 rounded-lg font-medium bg-surface border border-border text-muted hover:text-primary transition-colors'
          }
        >
          Relevant to my interests
        </button>
      )}

      <TabBar
        tabs={['Group Sessions', 'Mentor Sessions']}
        active={categoryTab}
        onChange={(t) => {
          setCategoryTab(t as typeof categoryTab)
          setTimeTab('Upcoming')
          setSelectedSectors(new Set())
          setSelectedStreams(new Set())
        }}
      />

      <TabBar
        tabs={['Upcoming', 'Past']}
        active={timeTab}
        onChange={(t) => {
          setTimeTab(t as typeof timeTab)
          setSelectedSectors(new Set())
          setSelectedStreams(new Set())
        }}
      />

      {categoryTab === 'Group Sessions' && timeTab === 'Upcoming' && (
        <p className="text-xs text-success font-medium">Free · No booking required — browse and enroll instantly.</p>
      )}

      {categoryTab === 'Group Sessions' && renderGroupContent()}
      {categoryTab === 'Mentor Sessions' && renderMentorContent()}
    </div>
  )
}

export default StudentSessions
