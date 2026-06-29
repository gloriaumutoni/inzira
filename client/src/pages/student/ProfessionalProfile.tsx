import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, CheckCircle, Users } from 'lucide-react'
import { api } from '@/api/axios'
import { getSectorStyle } from '@/utils/sectorColors'
import BookSessionModal from '@/components/sessions/BookSessionModal'

interface GroupSessionSummary {
  id: string
  title: string
  scheduledAt: string
  maxStudents: number
  _count: { enrolments: number }
}

interface ReviewData {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  student: { id: string }
}

interface ProfessionalProfileData {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  profilePhoto?: string | null
  linkedinUrl?: string | null
  isVerified: boolean
  offersFreeIntro: boolean
  offersProTier: boolean
  proRate: number
  averageRating: number | null
  reviews: ReviewData[]
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`h-4 w-4 ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
      />
    ))}
  </div>
)

const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null)
  const [groupSessions, setGroupSessions] = useState<GroupSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [bookingType, setBookingType] = useState<'FREE_INTRO' | 'PRO' | 'GROUP' | null>(null)
  const [bookingGroupSessionId, setBookingGroupSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [profileRes, gsRes] = await Promise.all([
          api.get(`/professionals/${id}`),
          api.get(`/group-sessions?professionalId=${id}&limit=3`),
        ])
        setProfile(profileRes.data.data)
        const raw = gsRes.data.data.sessions ?? gsRes.data.data
        const now = new Date()
        const upcoming = (raw as GroupSessionSummary[]).filter(
          (s) => new Date(s.scheduledAt) > now,
        )
        setGroupSessions(upcoming)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <div className="animate-pulse bg-border rounded-xl h-32" />
        <div className="animate-pulse bg-border rounded-xl h-48" />
        <div className="animate-pulse bg-border rounded-xl h-40" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted text-sm">Could not load this profile. Please try again.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-accent text-sm hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const sectorStyle = getSectorStyle(profile.sector)
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
  const nextGroupSession = groupSessions[0] ?? null
  const nextGsSlotsLeft = nextGroupSession
    ? nextGroupSession.maxStudents - nextGroupSession._count.enrolments
    : 0

  const anonymise = (studentId: string) =>
    `Student #${studentId.slice(-4).toUpperCase()}`

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <div className="flex items-start gap-4">
          {profile.profilePhoto ? (
            <img
              src={profile.profilePhoto}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: sectorStyle.bg }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-primary">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.isVerified && (
                <span className="flex items-center gap-1 text-xs text-accent font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted mt-0.5">{profile.jobTitle} · {profile.employer}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: sectorStyle.bg }}
              >
                {profile.sector}
              </span>
              {profile.averageRating !== null && (
                <div className="flex items-center gap-1">
                  <StarRating rating={profile.averageRating} />
                  <span className="text-xs text-muted">
                    {profile.averageRating.toFixed(1)} ({profile.reviews.length})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-primary mb-2">About</h2>
        <p className="text-sm text-muted leading-relaxed">{profile.bio}</p>
      </div>

      {/* Session options */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-primary mb-4">Book a Session</h2>
        <div className="divide-y divide-border">
          {profile.offersFreeIntro && (
            <div className="flex items-center justify-between py-3 first:pt-0">
              <div>
                <p className="text-sm font-medium text-primary">Free Intro Session</p>
                <p className="text-xs text-muted mt-0.5">20 min · 1-on-1 · Free</p>
              </div>
              <button
                onClick={() => setBookingType('FREE_INTRO')}
                className="bg-accent text-white text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors flex-shrink-0"
              >
                Book Intro
              </button>
            </div>
          )}
          {profile.offersProTier && (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-primary">Mentorship Session</p>
                <p className="text-xs text-muted mt-0.5">
                  60 min · 1-on-1 · {profile.proRate.toLocaleString()} RWF
                </p>
              </div>
              <button
                onClick={() => setBookingType('PRO')}
                className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                Book Session
              </button>
            </div>
          )}
          <div className="flex items-center justify-between py-3 last:pb-0">
            <div>
              <p className="text-sm font-medium text-primary">Group Sessions</p>
              {nextGroupSession ? (
                <p className="text-xs text-muted mt-0.5">
                  {new Date(nextGroupSession.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}{' '}
                  · {new Date(nextGroupSession.scheduledAt).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              ) : (
                <p className="text-xs text-muted mt-0.5">No upcoming group sessions</p>
              )}
            </div>
            {nextGroupSession && nextGsSlotsLeft > 0 ? (
              <button
                onClick={() => {
                  setBookingType('GROUP')
                  setBookingGroupSessionId(nextGroupSession.id)
                }}
                className="border border-primary text-primary text-xs px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors flex-shrink-0 flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                Join
              </button>
            ) : nextGroupSession && nextGsSlotsLeft <= 0 ? (
              <span className="text-xs text-error">Full</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <h2 className="text-sm font-semibold text-primary mb-4">
          Reviews{profile.reviews.length > 0 ? ` (${profile.reviews.length})` : ''}
        </h2>
        {profile.reviews.length === 0 ? (
          <p className="text-sm text-muted italic">
            No reviews yet — be the first to book a session.
          </p>
        ) : (
          <div className="space-y-4">
            {profile.reviews.map((r) => (
              <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <StarRating rating={r.rating} />
                  <span className="text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-muted italic mt-1">"{r.comment}"</p>
                )}
                <p className="text-xs text-subtle mt-1">{anonymise(r.student.id)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookingType && (
        <BookSessionModal
          professional={profile}
          defaultType={bookingType}
          groupSessionId={bookingGroupSessionId}
          onClose={() => {
            setBookingType(null)
            setBookingGroupSessionId(null)
          }}
        />
      )}
    </div>
  )
}

export { ProfessionalProfile }
