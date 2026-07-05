import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/axios'

export interface PendingReflection {
  sessionId: string
  type: 'ONE_ON_ONE' | 'GROUP'
  title: string
  scheduledAt: string
  combinations: string[]
}

const usePendingReflections = () => {
  const [pending, setPending] = useState<PendingReflection[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/students/me/pending-reflections')
      setPending(data.data.pending ?? [])
    } catch {
      // fail silently — non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const dismiss = (sessionId: string) => {
    setPending(prev => prev.filter(p => p.sessionId !== sessionId))
  }

  return { pending, loading, refetch: fetch, dismiss }
}

export default usePendingReflections
