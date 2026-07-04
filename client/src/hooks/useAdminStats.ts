import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface PlatformGrowthPoint {
  month: string
  sessions: number
  students: number
  revenue: number
}

export interface MentorSession {
  id: string
  studentName: string
  school: string | null
  type: string
  status: string
  scheduledAt: string
  grade: string
}

export interface GroupSessionItem {
  id: string
  title: string
  sector: string
  scheduledAt: string
  enrolmentCount: number
  isCancelled: boolean
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
  totalSessions: number
  totalGroupSessions: number
  newStudentsThisWeek: number
  newProfessionalsThisWeek: number
  mentorshipSessions: number
  userRegistrations: number
  approvedProfessionals: number
  approvedMentors: number
  activeMentors: number
  approvedCareerGuides: number
  pendingProfessionals: number
  pendingMentors: number
  pendingCareerGuides: number
  platformGrowth: PlatformGrowthPoint[]
  recentMentorSessions: MentorSession[]
  upcomingMentorSessions: MentorSession[]
  recentGroupSessions: GroupSessionItem[]
  upcomingGroupSessions: GroupSessionItem[]
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
        const raw = data.data
        setStats({
          ...raw,
          pendingProfessionals: raw.pendingProfessionals ?? 0,
          pendingMentors: raw.pendingMentors ?? 0,
          pendingCareerGuides: raw.pendingCareerGuides ?? 0,
          activeMentors: raw.activeMentors ?? 0,
          recentMentorSessions: raw.recentMentorSessions ?? [],
          upcomingMentorSessions: raw.upcomingMentorSessions ?? [],
          recentGroupSessions: raw.recentGroupSessions ?? [],
          upcomingGroupSessions: raw.upcomingGroupSessions ?? [],
        })
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
