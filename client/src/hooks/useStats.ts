import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface PlatformStats {
  oLevelStudents: number
  aLevelStudents: number
  professionals: number
  mentors: number
  careerGuides: number
  partnerSchools: number
}

interface UseStatsResult {
  stats: PlatformStats | null
  loading: boolean
  error: boolean
}

const useStats = (): UseStatsResult => {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/stats')
        setStats(data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading, error }
}

export default useStats
