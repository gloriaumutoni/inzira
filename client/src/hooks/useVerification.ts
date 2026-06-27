import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface PendingProfessional {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  submittedAt: string
}

export interface PendingCompany {
  id: string
  companyName: string
  email: string
  sector: string
  contactPerson: string
  submittedAt: string
}

interface UseVerificationResult {
  professionals: PendingProfessional[]
  companies: PendingCompany[]
  loading: boolean
  error: boolean
  refetch: () => void
}

const useVerification = (): UseVerificationResult => {
  const [professionals, setProfessionals] = useState<PendingProfessional[]>([])
  const [companies, setCompanies] = useState<PendingCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      setError(false)
      try {
        const [proRes, compRes] = await Promise.all([
          api.get('/admin/verification/professionals'),
          api.get('/admin/verification/companies'),
        ])

        const proData = proRes.data.data as Array<{
          id: string
          firstName: string
          lastName: string
          jobTitle: string
          employer: string
          sector: string
          createdAt: string
          user: { email: string }
        }>
        setProfessionals(
          proData.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.user.email,
            jobTitle: p.jobTitle,
            employer: p.employer,
            sector: p.sector,
            submittedAt: p.createdAt,
          })),
        )

        const compData = compRes.data.data as Array<{
          id: string
          companyName: string
          sector: string
          contactPerson: string
          createdAt: string
          user: { email: string }
        }>
        setCompanies(
          compData.map((c) => ({
            id: c.id,
            companyName: c.companyName,
            email: c.user.email,
            sector: c.sector,
            contactPerson: c.contactPerson,
            submittedAt: c.createdAt,
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

  return {
    professionals,
    companies,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}

export default useVerification
