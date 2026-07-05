import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface School {
  id: string
  name: string
  district: string
  isActive: boolean
}

export interface CareerGuideDashboard {
  school: School | null
  totalStudents: number
  avgConfidence: number
  totalSessions: number
  aLevelCount: number
}

interface UseCareerGuideDashboardResult {
  dashboard: CareerGuideDashboard | null
  loading: boolean
  error: boolean
}

const useCareerGuideDashboard = (): UseCareerGuideDashboardResult => {
  const [dashboard, setDashboard] = useState<CareerGuideDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/career-guides/me/dashboard')
        const raw = data.data
        const cohort = (raw.cohort ?? []) as Array<{ level: string }>
        setDashboard({
          school: raw.school ?? null,
          totalStudents: raw.totalStudents ?? 0,
          avgConfidence: raw.avgConfidence ?? 0,
          totalSessions: raw.totalSessions ?? 0,
          aLevelCount: cohort.filter((s) => s.level === 'A_LEVEL').length,
        })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { dashboard, loading, error }
}

export default useCareerGuideDashboard
