import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface School {
  id: string
  name: string
  district: string
  isActive: boolean
  studentCount: number
  careerGuide: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

interface UseSchoolsResult {
  schools: School[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useSchools = (): UseSchoolsResult => {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get('/schools')
        const raw = data.data as Array<{
          id: string
          name: string
          district: string
          isActive: boolean
          _count: { students: number }
          careerGuide: {
            id: string
            firstName: string
            lastName: string
            user: { email: string }
          } | null
        }>
        setSchools(
          raw.map((s) => ({
            id: s.id,
            name: s.name,
            district: s.district,
            isActive: s.isActive,
            studentCount: s._count.students,
            careerGuide: s.careerGuide
              ? {
                  id: s.careerGuide.id,
                  firstName: s.careerGuide.firstName,
                  lastName: s.careerGuide.lastName,
                  email: s.careerGuide.user.email,
                }
              : null,
          })),
        )
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [tick])

  return { schools, loading, error, refetch: () => setTick((t) => t + 1) }
}

export default useSchools
