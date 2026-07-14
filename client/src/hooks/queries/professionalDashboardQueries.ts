import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { api } from '@/api/axios'
import { getMyCareerStories, getCombinations, type CareerStory } from '@/api/careerStories.api'

export const professionalDashboardKeys = {
  groupSessionsMe: ['group-sessions', 'me'] as const,
  menteeSessions: ['sessions', 'mentee'] as const,
  careerStoriesMe: ['career-stories', 'me'] as const,
  careerStoryCombinations: ['career-stories', 'combinations'] as const,
  mentees: ['mentorships', 'students'] as const,
  mentorSlots: ['professionals', 'me', 'mentor-slots'] as const,
}

export interface GroupSession {
  id: string
  title: string
  scheduledAt: string
  maxStudents: number
  status: string
  joinLink?: string
  description?: string
  sector?: string
  isCancelled?: boolean
  _count?: { enrolments: number }
}

export interface MenteeSession {
  id: string
  scheduledAt: string
  type: string
  status: string
  duration: number
  student: { id: string; firstName: string; lastName: string }
}

export interface Mentee {
  id: string
  studentId: string
  plan: 'PRO' | 'PREMIUM'
  startDate: string
  student: {
    firstName: string
    lastName: string
    level: string
    combination?: string
    schoolId?: string
  }
  sessionsCompleted: number
  nextSession?: string
}

export interface MentorSlot {
  id: string
  scheduledAt: string
  durationMins: number
  isBooked: boolean
  meetLink: string | null
  Student: { id: string; firstName: string; lastName: string } | null
}

const fetchGroupSessionsMe = async (): Promise<GroupSession[]> => {
  const { data } = await api.get('/group-sessions/me')
  const raw: GroupSession[] = data.data.sessions ?? data.data ?? []
  return Array.from(new Map(raw.map(s => [s.id, s])).values())
}

const fetchMenteeSessions = async (): Promise<MenteeSession[]> => {
  const { data } = await api.get('/sessions?limit=1000')
  return data.data.sessions ?? []
}

export const useGroupSessionsMeQuery = () =>
  useQuery({
    queryKey: professionalDashboardKeys.groupSessionsMe,
    queryFn: fetchGroupSessionsMe,
  })

export const useMenteeSessionsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: professionalDashboardKeys.menteeSessions,
    queryFn: fetchMenteeSessions,
    enabled,
  })

export const useCareerStoriesMeQuery = (
  options?: Partial<UseQueryOptions<CareerStory[]>>
) =>
  useQuery({
    queryKey: professionalDashboardKeys.careerStoriesMe,
    queryFn: getMyCareerStories,
    ...options,
  })

export const useCareerStoryCombinationsQuery = (enabled = true) =>
  useQuery({
    queryKey: professionalDashboardKeys.careerStoryCombinations,
    queryFn: getCombinations,
    enabled,
    staleTime: Infinity,
  })

const fetchMentees = async (): Promise<Mentee[]> => {
  const { data } = await api.get('/mentorships/students')
  return data.data.mentees ?? data.data
}

export const useMenteesQuery = (enabled = true) =>
  useQuery({
    queryKey: professionalDashboardKeys.mentees,
    queryFn: fetchMentees,
    enabled,
  })

const fetchMentorSlots = async (): Promise<MentorSlot[]> => {
  const { data } = await api.get('/professionals/me/mentor-slots')
  return data.data.slots ?? []
}

export const useMentorSlotsQuery = () =>
  useQuery({
    queryKey: professionalDashboardKeys.mentorSlots,
    queryFn: fetchMentorSlots,
  })
