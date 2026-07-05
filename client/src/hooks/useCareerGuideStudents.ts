import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface SchoolStudent {
  id: string
  firstName: string
  lastName: string
  level: string
  schoolYear: string
  combination: string | null
  combinationsConsidering: string[]
  confidenceLevel: number | null
  joinedAt: string
  mentorEnrolled: number
  mentorCompleted: number
  groupEnrolled: number
  groupCompleted: number
  initialConfidence: number | null
  professionals: { name: string; sector: string }[]
  // engagement fields
  totalSessions: number
  lastSessionDate: string | null
  baselineConfidence: number | null
  currentConfidence: number | null
  confidenceDelta: number | null
  lastActiveDate: string | null
  needsAttention: boolean
}

const useCareerGuideStudents = () => {
  const [students, setStudents] = useState<SchoolStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/career-guides/me/students')
        setStudents(data.data.students)
      } catch {
        setError(true)
        toast.error('Could not load student data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { students, loading, error }
}

export default useCareerGuideStudents
