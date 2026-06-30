import { useState, useEffect } from 'react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

export interface AvailabilityTemplate {
  id: string
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

const useMentorAvailabilityTemplate = () => {
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/professionals/me/availability-template')
        setTemplates(data.data.templates)
      } catch {
        toast.error('Could not load your availability.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tick])

  const addSlot = async (slot: Omit<AvailabilityTemplate, 'id'>) => {
    await api.post('/professionals/me/availability-template', slot)
    setTick((t) => t + 1)
  }

  const removeSlot = async (id: string) => {
    await api.delete(`/professionals/me/availability-template/${id}`)
    setTick((t) => t + 1)
  }

  return { templates, loading, addSlot, removeSlot }
}

export default useMentorAvailabilityTemplate
