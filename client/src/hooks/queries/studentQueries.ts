import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'
import { listCareerStories, getCareerStory, type CareerStory, type CareerStoryListResponse } from '@/api/careerStories.api'
import { getCareerRoadmap, getReachableCareers, listCareers } from '@/api/careers.api'
import { getStreamSupply, saveQuizResult, type QuizResultPayload } from '@/api/students.api'
import type { ConfidenceLog, CombinationTrend } from '@/hooks/useConfidenceLogs'
import type { StudentDashboardData } from '@/hooks/useStudentDashboard'
import type { StudentSession } from '@/hooks/useStudentSessions'
import type { Professional } from '@/hooks/useProfessionals'

export interface MentorSlot {
  id: string
  scheduledAt: string
  durationMins: number
  meetLink: string | null
  Professional: { id: string; firstName: string; lastName: string; jobTitle: string }
}

export interface GroupSession {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  sector: string
  combinations: string[]
  maxStudents: number
  joinLink?: string
  professional: { id: string; firstName: string; lastName: string; jobTitle?: string }
  _count: { enrolments: number }
}

export interface GroupSessionEnrolment {
  id: string
  joinedAt: string
  groupSession: GroupSession
}

interface ProfessionalsParams {
  limit?: number
  sector?: string
  sectors?: string
  isMentor?: boolean
  combination?: string
}

interface GroupSessionsBrowseParams {
  combination?: string
  limit?: number
}

interface CareerStoriesParams {
  combination?: string
  sector?: string
  search?: string
  interests?: string
  page?: number
  limit?: number
}

export const studentQueryKeys = {
  dashboard: ['students', 'me', 'dashboard'] as const,
  confidence: ['students', 'me', 'confidence'] as const,
  mentorSlots: ['students', 'me', 'mentor-slots'] as const,
  groupEnrolments: ['students', 'me', 'group-sessions'] as const,
  groupSessionsBrowse: (params: GroupSessionsBrowseParams) => ['group-sessions', 'browse', params] as const,
  professionals: (params?: ProfessionalsParams) => ['professionals', params ?? {}] as const,
  sessionsMe: ['sessions', 'me'] as const,
  careerStories: (params?: CareerStoriesParams) => ['career-stories', 'list', params ?? {}] as const,
  careerStory: (id: string) => ['career-stories', 'detail', id] as const,
}

const fetchDashboard = async (): Promise<StudentDashboardData> => {
  const { data } = await api.get('/students/me/dashboard')
  return data.data
}

export const useStudentDashboardQuery = () =>
  useQuery({ queryKey: studentQueryKeys.dashboard, queryFn: fetchDashboard })

const fetchConfidenceLogs = async (): Promise<ConfidenceLog[]> => {
  const { data } = await api.get('/students/me/confidence')
  return data.data
}

export const useConfidenceLogsQuery = () =>
  useQuery({ queryKey: studentQueryKeys.confidence, queryFn: fetchConfidenceLogs })

export const groupLogsByCombo = (logs: ConfidenceLog[]): CombinationTrend[] => {
  const map = new Map<string, ConfidenceLog[]>()
  for (const log of logs) {
    const key = log.combination ?? 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(log)
  }
  return Array.from(map.entries()).map(([combination, entries]) => ({ combination, logs: entries }))
}

const fetchMentorSlots = async (): Promise<MentorSlot[]> => {
  const { data } = await api.get('/students/me/mentor-slots')
  return data.data.slots ?? []
}

export const useMentorSlotsQuery = () =>
  useQuery({ queryKey: studentQueryKeys.mentorSlots, queryFn: fetchMentorSlots })

const fetchGroupEnrolments = async (): Promise<GroupSessionEnrolment[]> => {
  const { data } = await api.get('/students/me/group-sessions')
  return data.data.enrolments ?? []
}

export const useGroupEnrolmentsQuery = () =>
  useQuery({ queryKey: studentQueryKeys.groupEnrolments, queryFn: fetchGroupEnrolments })

const fetchGroupSessionsBrowse = async (params: GroupSessionsBrowseParams): Promise<GroupSession[]> => {
  const query = new URLSearchParams({ limit: String(params.limit ?? 100) })
  if (params.combination) query.set('combination', params.combination)
  const { data } = await api.get(`/group-sessions?${query}`)
  return data.data.sessions ?? []
}

export const useGroupSessionsBrowseQuery = (params: GroupSessionsBrowseParams, enabled = true) =>
  useQuery({
    queryKey: studentQueryKeys.groupSessionsBrowse(params),
    queryFn: () => fetchGroupSessionsBrowse(params),
    enabled,
  })

export const useEnrolGroupSessionMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.post(`/group-sessions/${sessionId}/enrol`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] })
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.groupEnrolments })
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.dashboard })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not enrol. Please try again.'
      toast.error(msg)
    },
  })
}

const fetchProfessionals = async (params?: ProfessionalsParams): Promise<Professional[]> => {
  const query = new URLSearchParams({
    isVerified: 'true',
    isActive: 'true',
    ...(params?.limit && { limit: String(params.limit) }),
    ...(params?.sector && { sector: params.sector }),
  })
  if (params?.isMentor !== undefined) query.set('isMentor', String(params.isMentor))
  if (params?.combination) query.set('combination', params.combination)
  if (params?.sectors) query.set('sectors', params.sectors)
  const { data } = await api.get(`/professionals?${query}`)
  return data.data.professionals ?? data.data
}

export const useProfessionalsQuery = (params?: ProfessionalsParams) =>
  useQuery({ queryKey: studentQueryKeys.professionals(params), queryFn: () => fetchProfessionals(params) })

const fetchStudentSessions = async (): Promise<StudentSession[]> => {
  const { data } = await api.get('/sessions')
  return data.data.sessions ?? data.data
}

export const useStudentSessionsQuery = () =>
  useQuery({ queryKey: studentQueryKeys.sessionsMe, queryFn: fetchStudentSessions })

export const useCareerStoriesQuery = (params?: CareerStoriesParams) =>
  useQuery<CareerStoryListResponse>({
    queryKey: studentQueryKeys.careerStories(params),
    queryFn: () => listCareerStories(params),
    placeholderData: keepPreviousData,
  })

export const useCareerStoryQuery = (id: string | null, enabled = true) =>
  useQuery<CareerStory>({
    queryKey: studentQueryKeys.careerStory(id ?? ''),
    queryFn: () => getCareerStory(id as string),
    enabled: enabled && !!id,
  })

const fetchCareerStoriesDiscovery = async (combos: string[]): Promise<CareerStory[]> => {
  const results = await Promise.all(combos.map(c => listCareerStories({ combination: c, limit: 3 })))
  const seen = new Set<string>()
  const deduped: CareerStory[] = []
  for (const result of results) {
    for (const story of result.stories) {
      if (!seen.has(story.id)) {
        seen.add(story.id)
        deduped.push(story)
      }
    }
  }
  return deduped.slice(0, 3)
}

export const useCareerStoriesDiscoveryQuery = (combos: string[]) =>
  useQuery({
    queryKey: ['career-stories', 'discovery', combos] as const,
    queryFn: () => fetchCareerStoriesDiscovery(combos),
    enabled: combos.length > 0,
  })

// --- Career roadmap (P1) ---
export const useCareerRoadmap = (id: string) =>
  useQuery({
    queryKey: ['career-roadmap', id] as const,
    queryFn: () => getCareerRoadmap(id),
    enabled: !!id,
  })

export const useReachableCareers = () =>
  useQuery({
    queryKey: ['reachable-careers'] as const,
    queryFn: getReachableCareers,
  })

export const useCareersQuery = (params?: Parameters<typeof listCareers>[0]) =>
  useQuery({
    queryKey: ['careers', params ?? {}] as const,
    queryFn: () => listCareers(params),
  })

// --- Pathway/stream supply + quiz persistence (P2) ---
export const usePathwaySupply = () =>
  useQuery({
    queryKey: ['stream-supply'] as const,
    queryFn: getStreamSupply,
  })

export const useSaveQuizResult = () =>
  useMutation({
    mutationFn: (payload: QuizResultPayload) => saveQuizResult(payload),
  })

export const useSavePathway = () =>
  useMutation({
    mutationFn: (pathway: string) => api.patch('/students/me/pathway', { pathway }),
  })
