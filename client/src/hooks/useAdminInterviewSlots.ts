import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface AdminInterviewSlot {
  id: string
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
}

interface UseAdminInterviewSlotsResult {
  slots: AdminInterviewSlot[]
  loading: boolean
  refetch: () => void
}

const useAdminInterviewSlots = (): UseAdminInterviewSlotsResult => {
  const [slots, setSlots] = useState<AdminInterviewSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/admin/interview-slots')
        setSlots(data.data.slots)
      } catch {
        setSlots([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { slots, loading, refetch: () => setTick((t) => t + 1) }
}

export default useAdminInterviewSlots
