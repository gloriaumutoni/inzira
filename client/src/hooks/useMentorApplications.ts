import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface MentorApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  linkedinUrl: string
  mentorBio: string
  appliedAt: string
  mentorApplicationAttempts: number
  mentorRejectionReason: string | null
  interview: {
    scheduledAt: string
    meetLink: string
  } | null
}

interface UseMentorApplicationsResult {
  applications: MentorApplication[]
  loading: boolean
  refetch: () => void
}

const useMentorApplications = (): UseMentorApplicationsResult => {
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/admin/verification/mentors')
        const raw = data.data as Array<{
          id: string
          firstName: string
          lastName: string
          jobTitle: string
          employer: string
          sector: string
          linkedinUrl: string
          mentorBio: string
          mentorApplicationAttempts: number
          mentorRejectionReason: string | null
          createdAt: string
          interviewBooking: { scheduledAt: string; meetLink: string } | null
          user: { email: string }
        }>
        setApplications(
          raw.map((m) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.user.email,
            jobTitle: m.jobTitle,
            employer: m.employer,
            sector: m.sector,
            linkedinUrl: m.linkedinUrl,
            mentorBio: m.mentorBio,
            appliedAt: m.createdAt,
            interview: m.interviewBooking
              ? { scheduledAt: m.interviewBooking.scheduledAt, meetLink: m.interviewBooking.meetLink }
              : null,
            mentorApplicationAttempts: m.mentorApplicationAttempts ?? 0,
            mentorRejectionReason: m.mentorRejectionReason ?? null,
          })),
        )
      } catch (err) {
        console.error('useMentorApplications fetch error:', err)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { applications, loading, refetch: () => setTick((t) => t + 1) }
}

export default useMentorApplications
