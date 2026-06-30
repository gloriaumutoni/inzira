import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface MentorSlotData {
  id: string
  scheduledAt: string
  durationMins: number
  isBooked: boolean
  meetLink?: string | null
  student?: {
    firstName: string
    lastName: string
    level: string
    combination?: string | null
  } | null
}

const useMentorSlots = () => {
  const [slots, setSlots] = useState<MentorSlotData[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/mentor-slots/me')
        setSlots(data.data.slots)
      } catch {
        toast.error('Could not load your slots.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { slots, loading, refetch: () => setTick((t) => t + 1) }
}

export default useMentorSlots
