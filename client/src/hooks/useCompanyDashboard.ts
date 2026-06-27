import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface CompanyStats {
  workshopsPublished: number
  totalRegistrations: number
  upcomingWorkshops: number
}

interface UseCompanyDashboardResult {
  stats: CompanyStats | null
  loading: boolean
  error: boolean
}

const useCompanyDashboard = (): UseCompanyDashboardResult => {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/companies/me/dashboard')
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

export default useCompanyDashboard
