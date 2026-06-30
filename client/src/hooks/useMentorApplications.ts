import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface MentorApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  linkedinUrl: string | null
  mentorBio: string | null
  mentorApplicationStatus: string
  appliedAt: string
  interview: {
    scheduledAt: string
    meetLink: string
    adminSlotId: string
  } | null
}

interface UseMentorApplicationsResult {
  applications: MentorApplication[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useMentorApplications = (): UseMentorApplicationsResult => {
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get('/admin/verification/mentors')
        setApplications(data.data.applications)
      } catch (err) {
        console.error('useMentorApplications fetch error:', err)
        setError(true)
        toast.error('Unable to load mentor applications.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { applications, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useMentorApplications
