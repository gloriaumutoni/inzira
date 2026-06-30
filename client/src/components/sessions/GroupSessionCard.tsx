import { useState } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import { getSectorStyle } from '@/utils/sectorColors'
import GroupSessionJoinModal from './GroupSessionJoinModal'

export interface GroupSessionData {
  id: string
  title: string
  sector: string
  scheduledAt: string
  duration?: number
  maxStudents: number
  currentEnrollment: number
  isRegistered: boolean
  joinLink?: string | null
  professional?: {
    firstName: string
    lastName: string
    jobTitle?: string
    sector: string
  }
}

interface GroupSessionCardProps {
  session: GroupSessionData
  onRegisterSuccess?: (sessionId: string) => void
}

const GroupSessionCard = ({ session, onRegisterSuccess }: GroupSessionCardProps) => {
  const [isRegistered, setIsRegistered] = useState(session.isRegistered)
  const [enrollment, setEnrollment] = useState(session.currentEnrollment ?? 0)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const slotsLeft = session.maxStudents - (enrollment ?? 0)
  const isFull = slotsLeft <= 0
  const style = getSectorStyle(session.professional?.sector ?? session.sector)

  const date = new Date(session.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const time = new Date(session.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleRegister = async () => {
    setLoading(true)
    try {
      await api.post(`/group-sessions/${session.id}/enrol`)
      setIsRegistered(true)
      setEnrollment((prev) => prev + 1)
      onRegisterSuccess?.(session.id)
      toast.success('You are registered! The session will appear in your sessions.')
    } catch {
      toast.error('Could not register for this session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-5 text-white flex flex-col justify-between min-h-[180px]"
      style={{ backgroundColor: style.bg }}
    >
      <div>
        <p className="text-sm font-bold leading-snug">{session.title}</p>
        {session.professional && (
          <p className="text-xs text-white/80 mt-1">
            {session.professional.firstName} {session.professional.lastName}
            {session.professional.jobTitle ? ` — ${session.professional.jobTitle}` : ''}
          </p>
        )}
        <p className="text-xs text-white/70 mt-2">
          {date} · {time}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {isFull ? (
            <span className="bg-error/80 text-white text-xs px-2 py-0.5 rounded-full">Full</span>
          ) : (
            <span className="text-xs text-white/70">{slotsLeft} slots left</span>
          )}
          <span className="text-xs text-white/50">
            {enrollment}/{session.maxStudents}
          </span>
        </div>

        {isFull && !isRegistered ? null : isRegistered ? (
          <button
            onClick={() => setShowModal(true)}
            className="bg-accent hover:bg-accent/90 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Join Session
          </button>
        ) : (
          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        )}
      </div>

      {showModal && (
        <GroupSessionJoinModal
          session={{
            id: session.id,
            title: session.title,
            scheduledAt: session.scheduledAt,
            maxStudents: session.maxStudents,
            currentEnrollment: enrollment,
            joinLink: session.joinLink ?? undefined,
            professional: session.professional
              ? {
                  firstName: session.professional.firstName,
                  lastName: session.professional.lastName,
                  jobTitle: session.professional.jobTitle,
                  sector: session.professional.sector,
                }
              : undefined,
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default GroupSessionCard
