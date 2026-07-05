import { useState, useEffect } from 'react'
import { api } from '@/api/axios'

export interface ReportStudent {
  id: string
  firstName: string
  lastName: string
  school: string | null
  level: 'A_LEVEL' | 'O_LEVEL'
  schoolYear: string
  combination: string | null
  createdAt: string
  sessionCount: number
}

export interface ReportProfessional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  email: string
  createdAt: string
  completedSessions: number
  upcomingSessions: number
}

export interface ReportCareerGuide {
  id: string
  firstName: string
  lastName: string
  email: string
  school: { name: string; district: string } | null
  createdAt: string
}

export interface ReportSummary {
  totalStudents: number
  engagingStudents: number
  totalSessions: number
  completedSessions: number
  completionRate: number
}

interface PagedState<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
}

function usePagedFetch<T>(
  url: string,
  params: Record<string, string | number>,
  dataKey: string,
  deps: unknown[],
): PagedState<T> {
  const [state, setState] = useState<PagedState<T>>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString()
    api
      .get(`${url}?${query}`)
      .then(({ data }) => {
        if (cancelled) return
        const d = data.data
        setState({
          data: d[dataKey] ?? [],
          total: d.total,
          page: d.page,
          totalPages: d.totalPages,
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (cancelled) return
        const status = err?.response?.status
        const msg =
          status === 401 || status === 403
            ? 'Session expired — please refresh the page.'
            : 'Failed to load data. Please try again.'
        setState((s) => ({ ...s, loading: false, error: msg }))
      })
    return () => {
      cancelled = true
    }
    // deps are passed explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export const useReportStudents = (level: 'A_LEVEL' | 'O_LEVEL', page: number) =>
  usePagedFetch<ReportStudent>('/admin/reports/students', { level, page }, 'students', [level, page])

export const useReportProfessionals = (type: 'professional' | 'mentor' | 'rejected' | 'mentor-rejected', page: number) =>
  usePagedFetch<ReportProfessional>(
    '/admin/reports/professionals',
    { type, page },
    'professionals',
    [type, page],
  )

export const useReportCareerGuides = (page: number, status: 'approved' | 'rejected' = 'approved') =>
  usePagedFetch<ReportCareerGuide>(
    '/admin/reports/career-guides',
    { page, status },
    'careerGuides',
    [page, status],
  )

export const fetchAllReportStudents = async (level: 'A_LEVEL' | 'O_LEVEL'): Promise<ReportStudent[]> => {
  const { data } = await api.get(`/admin/reports/students?level=${level}&all=true`)
  return data.data.students
}

export const fetchAllReportProfessionals = async (
  type: 'professional' | 'mentor' | 'rejected' | 'mentor-rejected',
): Promise<ReportProfessional[]> => {
  const { data } = await api.get(`/admin/reports/professionals?type=${type}&all=true`)
  return data.data.professionals
}

export const fetchAllReportCareerGuides = async (
  status: 'approved' | 'rejected' = 'approved',
): Promise<ReportCareerGuide[]> => {
  const { data } = await api.get(`/admin/reports/career-guides?status=${status}&all=true`)
  return data.data.careerGuides
}

export const useReportSummary = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/admin/reports/summary')
      .then(({ data }) => setSummary(data.data))
      .finally(() => setLoading(false))
  }, [])

  return { summary, loading }
}
