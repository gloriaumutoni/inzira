import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import type { CombinationTrend, ConfidenceLog } from '@/hooks/useConfidenceLogs'

export interface SessionHistoryItem {
  id: string
  type: '1-on-1' | 'Group'
  sessionType: string | null
  date: string
  status: string
  professionalName: string
  title?: string
}

export interface StudentDetail {
  id: string
  firstName: string
  lastName: string
  level: string
  schoolYear: string
  combinationsConsidering: string[]
  joinedAt: string
  sessionHistory: SessionHistoryItem[]
  confidenceLogs: ConfidenceLog[]
  confidenceTrends: CombinationTrend[]
}

const useCareerGuideStudentDetail = (studentId: string | null) => {
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!studentId) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(false)
    const fetch = async () => {
      try {
        const { data } = await api.get(`/career-guides/me/students/${studentId}`)
        const raw = data.data
        const logs: ConfidenceLog[] = raw.confidenceLogs ?? []

        const trendMap = new Map<string, ConfidenceLog[]>()
        for (const log of logs) {
          const key = log.combination ?? 'General'
          if (!trendMap.has(key)) trendMap.set(key, [])
          trendMap.get(key)!.push(log)
        }
        const confidenceTrends: CombinationTrend[] = Array.from(trendMap.entries()).map(
          ([combination, entries]) => ({ combination, logs: entries }),
        )

        setDetail({ ...raw, confidenceLogs: logs, confidenceTrends })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [studentId])

  return { detail, loading, error }
}

export default useCareerGuideStudentDetail
