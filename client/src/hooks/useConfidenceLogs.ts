import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/axios'

export interface ConfidenceLog {
  id: string
  score: number
  note: string | null
  combination: string | null
  sessionId: string | null
  changedThinking: boolean | null
  createdAt: string
}

export interface CombinationTrend {
  combination: string
  logs: ConfidenceLog[]
}

const useConfidenceLogs = () => {
  const [logs, setLogs] = useState<ConfidenceLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/students/me/confidence')
      setLogs(data.data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const byCombo: CombinationTrend[] = (() => {
    const map = new Map<string, ConfidenceLog[]>()
    for (const log of logs) {
      const key = log.combination ?? 'General'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(log)
    }
    return Array.from(map.entries()).map(([combination, entries]) => ({ combination, logs: entries }))
  })()

  return { logs, byCombo, loading, refetch: fetch }
}

export default useConfidenceLogs
