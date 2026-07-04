import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface SlotBooking {
  id: string
  scheduledAt: string
  meetLink: string
  professional: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
    employer: string
    mentorBio: string | null
    mentorAppliedAt: string | null
    user: { email: string }
  }
}

export interface AdminInterviewSlot {
  id: string
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
  isActive: boolean
  bookings: SlotBooking[]
}

const useAdminInterviewSlots = () => {
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
        toast.error('Could not load interview slots.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  return { slots, loading, refetch: () => setTick((t) => t + 1) }
}

export default useAdminInterviewSlots
