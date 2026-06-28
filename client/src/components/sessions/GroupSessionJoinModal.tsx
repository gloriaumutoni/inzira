import { X, ExternalLink, Calendar, Users, Video } from 'lucide-react'

interface GroupSessionJoinModalProps {
  session: {
    id: string
    title: string
    topic?: string
    scheduledAt: string
    maxStudents: number
    currentEnrollment: number
    joinLink?: string
    professional?: {
      firstName: string
      lastName: string
      jobTitle?: string
      sector: string
    }
  }
  onClose: () => void
}

const GroupSessionJoinModal = ({ session, onClose }: GroupSessionJoinModalProps) => {
  const handleJoin = () => {
    if (session.joinLink) {
      window.open(session.joinLink, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
              Group Session
            </span>
            <h2 className="text-lg font-bold text-primary mt-2">{session.title}</h2>
            {session.topic && (
              <p className="text-sm text-muted mt-1">{session.topic}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary ml-4 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mt-5 border-t border-border pt-5">
          {session.professional && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
                {session.professional.firstName[0]}{session.professional.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">
                  {session.professional.firstName} {session.professional.lastName}
                </p>
                <p className="text-xs text-muted">{session.professional.jobTitle}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {' at '}
              {new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>
              {session.currentEnrollment} / {session.maxStudents} students enrolled
            </span>
          </div>

          {session.joinLink && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Video className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{session.joinLink}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background transition-colors"
          >
            Close
          </button>
          {session.joinLink ? (
            <button
              onClick={handleJoin}
              className="flex-1 bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              Join Session
              <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-border text-muted py-2.5 rounded-lg text-sm font-semibold cursor-not-allowed"
            >
              Link not available yet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupSessionJoinModal
