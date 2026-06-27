import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface ProfessionalStats {
  pendingRequests: number
  sessionsCompleted: number
  studentsReached: number
}

interface UseProDashboardResult {
  stats: ProfessionalStats | null
  loading: boolean
  error: boolean
}

const useProfessionalDashboard = (): UseProDashboardResult => {
  const [stats, setStats] = useState<ProfessionalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/professionals/me/dashboard')
        setStats(data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { stats, loading, error }
}

export default useProfessionalDashboard
