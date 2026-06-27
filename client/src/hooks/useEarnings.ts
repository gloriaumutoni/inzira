import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

interface Transaction {
  id: string
  date: string
  type: 'FREE_INTRO' | 'PRO' | 'PREMIUM'
  studentName: string
  details: string
  gross: number
  commission: number
  net: number
}

interface Earnings {
  availableBalance: number
  totalEarnings: number
  thisMonth: number
  activePremiumStudents: number
  transactions: Transaction[]
}

interface UseEarningsResult {
  earnings: Earnings | null
  loading: boolean
  error: boolean
  refetch: () => void
}

const useEarnings = (): UseEarningsResult => {
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/payments/professional')
        setEarnings(data.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { earnings, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useEarnings
