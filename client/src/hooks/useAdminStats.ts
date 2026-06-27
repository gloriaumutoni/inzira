import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface PlatformGrowthPoint {
  month: string
  sessions: number
  students: number
  revenue: number
}

export interface RecentSession {
  id: string
  studentCode: string
  type: string
  status: string
  scheduledAt: string
  grade: string
}

export interface PlatformHealth {
  verificationQueueClear: boolean
  commissionRate: number
  sessionsPerWeek: number
  activeAmbassadors: number
}

export interface AdminStats {
  totalStudents: number
  activeProfessionals: number
  partnerCompanies: number
  totalSessions: number
  totalGroupSessions: number
  totalWorkshops: number
  grossRevenue: number
  grossCommission: number
  newStudentsThisWeek: number
  newProfessionalsThisWeek: number
  mentorshipSessions: number
  mentorshipSessionsLastWeek: number
  totalCommission: number
  totalCommissionLastWeek: number
  userRegistrations: number
  userRegistrationsLastWeek: number
  supportTickets: number
  supportTicketsLastWeek: number
  platformGrowth: PlatformGrowthPoint[]
  recentSessions: RecentSession[]
  platformHealth: PlatformHealth
}

interface UseAdminStatsResult {
  stats: AdminStats | null
  loading: boolean
  error: boolean
  refetch: () => void
}

const useAdminStats = (): UseAdminStatsResult => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get('/admin/stats')
        setStats(data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { stats, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useAdminStats
