import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api/axios'
import { getSectorStyle } from '@/utils/sectorColors'
import SlotPickerModal from '@/components/sessions/SlotPickerModal'

interface Career {
  id: string
  title: string
  sector: string
}

interface ProfessionalDetail {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  isMentor: boolean
  isVerified: boolean
  linkedinUrl: string | null
  careers: Career[]
}

interface ProfessionalProfileModalProps {
  professionalId: string
  onClose: () => void
}

const ProfessionalProfileModal = ({ professionalId, onClose }: ProfessionalProfileModalProps) => {
  const [profile, setProfile] = useState<ProfessionalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showSlotPicker, setShowSlotPicker] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/professionals/${professionalId}`)
        setProfile(data.data ?? data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [professionalId])

  if (showSlotPicker && profile) {
    return (
      <SlotPickerModal
        mentorId={profile.id}
        mentorName={`${profile.firstName} ${profile.lastName}`}
        mentorJobTitle={profile.jobTitle}
        onClose={() => setShowSlotPicker(false)}
        onBooked={() => { setShowSlotPicker(false); onClose() }}
      />
    )
  }

  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  const renderBody = () => {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-border mx-auto" />
          <div className="h-5 bg-border rounded w-48 mx-auto" />
          <div className="h-4 bg-border rounded w-36 mx-auto" />
          <div className="h-20 bg-border rounded" />
        </div>
      )
    }
    if (error) {
      return <p className="text-sm text-muted text-center py-6">Could not load profile. Please try again.</p>
    }
    if (!profile) {
      return <p className="text-sm text-muted text-center py-6">This professional is no longer available.</p>
    }
    return (
      <>
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-accent/10 text-accent text-xl font-bold flex items-center justify-center">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-muted">{profile.jobTitle} · {profile.employer}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span
              className="text-xs text-white px-2 py-0.5 rounded-full"
              style={{ backgroundColor: getSectorStyle(profile.sector).bg }}
            >
              {profile.sector}
            </span>
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                LinkedIn ↗
              </a>
            )}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">About</p>
            <p className="text-sm text-primary leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.careers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Careers represented</p>
            <div className="flex flex-wrap gap-2">
              {profile.careers.map((c) => (
                <span key={c.id} className="bg-background text-primary text-xs px-2 py-1 rounded-full border border-border">
                  {c.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          {profile.isMentor ? (
            <button
              onClick={() => setShowSlotPicker(true)}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors"
            >
              Book a 1-on-1 Session
            </button>
          ) : (
            <div className="bg-background border border-border rounded-lg p-4">
              <p className="text-sm text-muted text-center">
                This professional hosts <strong className="text-primary">group sessions</strong> only.
              </p>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {renderBody()}
      </div>
    </div>
  )
}

export default ProfessionalProfileModal
