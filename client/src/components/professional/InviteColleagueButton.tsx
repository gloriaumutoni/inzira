import { useState } from 'react'
import { UserPlus, Check, Copy } from 'lucide-react'

export function InviteColleagueButton({ professionalId }: Readonly<{ professionalId: string }>) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/signup?role=professional&ref=${professionalId}`
  const mailtoHref = `mailto:?subject=${encodeURIComponent('Join me as a mentor on Inzira')}&body=${encodeURIComponent(
    `Hey — I've been mentoring students on Inzira and thought you'd be great at it too. Sign up here: ${inviteLink}`
  )}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — mailto link still works
    }
  }

  return (
    <div className="bg-surface border border-dashed border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 flex items-start gap-3">
        <UserPlus className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Invite a colleague to mentor</p>
          <p className="text-xs text-muted mt-1">Recruit a peer into a thin pathway — students in your area need more mentors.</p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={mailtoHref}
          className="text-sm px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Email invite
        </a>
      </div>
    </div>
  )
}
