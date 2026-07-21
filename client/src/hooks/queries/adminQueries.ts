import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/axios'
import {
  adminListStoriesByStatus,
  adminApproveStory,
  adminRejectStory,
  adminUnpublishStory,
  adminCreateCareerStory,
  adminListVerifiedProfessionals,
  type CareerStory,
  type AdminCareerStoryPayload,
  type VerifiedProfessional,
} from '@/api/careerStories.api'
import {
  adminListAllCareers,
  adminCreateCareer,
  adminUpdateCareer,
  adminToggleCareer,
  adminDeleteCareer,
  addCareerStep,
  updateCareerStep,
  deleteCareerStep,
  getAdminCoverage,
  getAdminImpact,
  type AdminCareer,
  type CareerUpsertPayload,
  type StepPayload,
  type CoverageResponse,
  type ImpactResponse,
} from '@/api/careers.api'

export type VerificationType = 'professionals' | 'mentors' | 'career-guides'
export type CareerStoryTab = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'

export interface PlatformGrowthPoint {
  month: string
  sessions: number
  students: number
  revenue: number
}

export interface MentorSession {
  id: string
  studentName: string
  school: string | null
  type: string
  status: string
  scheduledAt: string
  grade: string
}

export interface GroupSessionItem {
  id: string
  title: string
  sector: string
  scheduledAt: string
  enrolmentCount: number
  isCancelled: boolean
}

export interface PlatformHealth {
  verificationQueueClear: boolean
  commissionRate: number
  sessionsPerWeek: number
  activeAmbassadors: number
}

export interface AdminStats {
  totalStudents: number
  activeProfessionals: number
  totalSessions: number
  totalGroupSessions: number
  newStudentsThisWeek: number
  newProfessionalsThisWeek: number
  mentorshipSessions: number
  userRegistrations: number
  approvedProfessionals: number
  approvedMentors: number
  activeMentors: number
  approvedCareerGuides: number
  pendingProfessionals: number
  pendingMentors: number
  pendingCareerGuides: number
  platformGrowth: PlatformGrowthPoint[]
  recentMentorSessions: MentorSession[]
  upcomingMentorSessions: MentorSession[]
  recentGroupSessions: GroupSessionItem[]
  upcomingGroupSessions: GroupSessionItem[]
  platformHealth: PlatformHealth
}

export interface PendingProfessional {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  linkedinUrl?: string
  submittedAt: string
  rejectionCount: number
  rejectionReason: string | null
}

export interface MentorApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  employer: string
  sector: string
  linkedinUrl: string
  mentorBio: string
  appliedAt: string
  mentorRejectionCount: number
  mentorRejectionReason: string | null
  interview: { scheduledAt: string; meetLink: string } | null
}

export interface PendingCareerGuide {
  id: string
  firstName: string
  lastName: string
  email: string
  school: string | null
  linkedinUrl: string | null
  submittedAt: string
  rejectionCount: number
  rejectionReason: string | null
}

export interface School {
  id: string
  name: string
  district: string
  isActive: boolean
  studentCount: number
  careerGuide: { id: string; firstName: string; lastName: string; email: string } | null
}

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
  endDate: string | null
  bookings: SlotBooking[]
}

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

export interface PagedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export type ReportProfessionalType = 'professional' | 'mentor' | 'rejected' | 'mentor-rejected'

export type ReportReason = 'INAPPROPRIATE_BEHAVIOUR' | 'UNCOMFORTABLE_CONTENT' | 'NO_SHOW' | 'HARASSMENT' | 'OTHER'
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'

export interface ReportedProfessional {
  id: string
  firstName: string
  lastName: string
  isActive: boolean
}

export interface SessionReport {
  id: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  createdAt: string
  session?: {
    id: string
    scheduledAt: string
    student: { firstName: string; lastName: string }
    professional: ReportedProfessional
  }
  groupSession?: {
    id: string
    title: string
    scheduledAt: string
    professional: ReportedProfessional
  }
  reporter: { id: string; email: string; student?: { firstName: string; lastName: string } | null }
}

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  verification: (type: VerificationType) => ['admin', 'verification', type] as const,
  schools: ['schools'] as const,
  interviewSlots: ['admin', 'interview-slots'] as const,
  careerStories: (tab: CareerStoryTab) => ['admin', 'career-stories', tab] as const,
  verifiedProfessionals: ['admin', 'career-stories', 'professionals', 'verified'] as const,
  reportStudents: (level: 'A_LEVEL' | 'O_LEVEL', page: number) => ['admin', 'reports', 'students', level, page] as const,
  reportProfessionals: (type: ReportProfessionalType, page: number) => ['admin', 'reports', 'professionals', type, page] as const,
  reportCareerGuides: (page: number, status: 'approved' | 'rejected') => ['admin', 'reports', 'career-guides', page, status] as const,
  reportSummary: ['admin', 'reports', 'summary'] as const,
  sessionReports: (filter: ReportStatus | 'ALL') => ['admin', 'session-reports', filter] as const,
  careers: ['admin', 'careers'] as const,
  coverage: ['admin', 'coverage'] as const,
  impact: (schoolId?: string, level?: string) => ['admin', 'impact', schoolId, level] as const,
}

// ---------- Stats ----------

const fetchAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get('/admin/stats')
  const raw = data.data
  return {
    ...raw,
    pendingProfessionals: raw.pendingProfessionals ?? 0,
    pendingMentors: raw.pendingMentors ?? 0,
    pendingCareerGuides: raw.pendingCareerGuides ?? 0,
    activeMentors: raw.activeMentors ?? 0,
    recentMentorSessions: raw.recentMentorSessions ?? [],
    upcomingMentorSessions: raw.upcomingMentorSessions ?? [],
    recentGroupSessions: raw.recentGroupSessions ?? [],
    upcomingGroupSessions: raw.upcomingGroupSessions ?? [],
  }
}

export const useAdminStatsQuery = () =>
  useQuery({ queryKey: adminKeys.stats, queryFn: fetchAdminStats })

// ---------- Verification ----------

const fetchVerificationProfessionals = async (): Promise<PendingProfessional[]> => {
  const { data } = await api.get('/admin/verification/professionals')
  const raw = data.data as Array<{
    id: string; firstName: string; lastName: string; jobTitle: string; employer: string
    sector: string; bio: string; linkedinUrl?: string; createdAt: string
    rejectionCount: number; rejectionReason: string | null; user: { email: string }
  }>
  return raw.map((p) => ({
    id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.user.email,
    jobTitle: p.jobTitle, employer: p.employer, sector: p.sector, bio: p.bio,
    linkedinUrl: p.linkedinUrl, submittedAt: p.createdAt,
    rejectionCount: p.rejectionCount ?? 0, rejectionReason: p.rejectionReason ?? null,
  }))
}

const fetchMentorApplications = async (): Promise<MentorApplication[]> => {
  const { data } = await api.get('/admin/verification/mentors')
  const raw = data.data as Array<{
    id: string; firstName: string; lastName: string; jobTitle: string; employer: string
    sector: string; linkedinUrl: string; mentorBio: string; mentorRejectionCount: number
    mentorRejectionReason: string | null; createdAt: string
    interviewBooking: { scheduledAt: string; meetLink: string } | null; user: { email: string }
  }>
  return raw.map((m) => ({
    id: m.id, firstName: m.firstName, lastName: m.lastName, email: m.user.email,
    jobTitle: m.jobTitle, employer: m.employer, sector: m.sector, linkedinUrl: m.linkedinUrl,
    mentorBio: m.mentorBio, appliedAt: m.createdAt,
    interview: m.interviewBooking
      ? { scheduledAt: m.interviewBooking.scheduledAt, meetLink: m.interviewBooking.meetLink }
      : null,
    mentorRejectionCount: m.mentorRejectionCount ?? 0, mentorRejectionReason: m.mentorRejectionReason ?? null,
  }))
}

const fetchCareerGuideVerification = async (): Promise<PendingCareerGuide[]> => {
  const { data } = await api.get('/admin/verification/career-guides')
  const raw = data.data as Array<{
    id: string; firstName: string; lastName: string; linkedinUrl: string | null; createdAt: string
    rejectionCount: number; rejectionReason: string | null
    school: { name: string } | null; user: { email: string }
  }>
  return raw.map((cg) => ({
    id: cg.id, firstName: cg.firstName, lastName: cg.lastName, email: cg.user.email,
    school: cg.school?.name ?? null, linkedinUrl: cg.linkedinUrl, submittedAt: cg.createdAt,
    rejectionCount: cg.rejectionCount ?? 0, rejectionReason: cg.rejectionReason ?? null,
  }))
}

export const useVerificationProfessionalsQuery = () =>
  useQuery({ queryKey: adminKeys.verification('professionals'), queryFn: fetchVerificationProfessionals })

export const useMentorApplicationsQuery = () =>
  useQuery({ queryKey: adminKeys.verification('mentors'), queryFn: fetchMentorApplications })

export const useCareerGuideVerificationQuery = () =>
  useQuery({ queryKey: adminKeys.verification('career-guides'), queryFn: fetchCareerGuideVerification })

export const useApproveVerificationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, id }: { type: VerificationType; id: string }) =>
      api.patch(`/admin/verification/${type}/${id}/approve`),
    onSuccess: (_data, { type }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verification(type) })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

export const useRejectVerificationMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, id, reason }: { type: VerificationType; id: string; reason: string }) =>
      api.patch(`/admin/verification/${type}/${id}/reject`, { reason }),
    onSuccess: (_data, { type }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verification(type) })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

// ---------- Schools ----------

const fetchSchools = async (): Promise<School[]> => {
  const { data } = await api.get('/schools')
  const raw = data.data as Array<{
    id: string; name: string; district: string; isActive: boolean
    _count: { students: number }
    careerGuide: { id: string; firstName: string; lastName: string; user: { email: string } } | null
  }>
  return raw.map((s) => ({
    id: s.id, name: s.name, district: s.district, isActive: s.isActive,
    studentCount: s._count.students,
    careerGuide: s.careerGuide
      ? { id: s.careerGuide.id, firstName: s.careerGuide.firstName, lastName: s.careerGuide.lastName, email: s.careerGuide.user.email }
      : null,
  }))
}

export const useSchoolsQuery = () =>
  useQuery({ queryKey: adminKeys.schools, queryFn: fetchSchools })

export const useAddSchoolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; district: string }) => api.post('/schools', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.schools }),
  })
}

export const useAssignCareerGuideMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ schoolId, email }: { schoolId: string; email: string }) =>
      api.post(`/schools/${schoolId}/career-guide`, { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.schools }),
  })
}

export const useDeactivateSchoolMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (schoolId: string) => api.patch(`/schools/${schoolId}`, { isActive: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.schools }),
  })
}

// ---------- Interview slots ----------

const fetchInterviewSlots = async (): Promise<AdminInterviewSlot[]> => {
  const { data } = await api.get('/admin/interview-slots')
  return data.data.slots
}

export const useInterviewSlotsQuery = () =>
  useQuery({ queryKey: adminKeys.interviewSlots, queryFn: fetchInterviewSlots })

interface InterviewSlotPayload {
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
  endDate: string | null
}

export const useAddInterviewSlotMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InterviewSlotPayload) => api.post('/admin/interview-slots', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.interviewSlots }),
  })
}

export const useUpdateInterviewSlotMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InterviewSlotPayload }) =>
      api.put(`/admin/interview-slots/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.interviewSlots }),
  })
}

export const useDeleteInterviewSlotMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/interview-slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.interviewSlots }),
  })
}

// ---------- Career stories (admin review) ----------

export const useAdminCareerStoriesQuery = (tab: CareerStoryTab) =>
  useQuery({ queryKey: adminKeys.careerStories(tab), queryFn: () => adminListStoriesByStatus(tab) })

export const useVerifiedProfessionalsQuery = (enabled = true) =>
  useQuery<VerifiedProfessional[]>({
    queryKey: adminKeys.verifiedProfessionals,
    queryFn: adminListVerifiedProfessionals,
    enabled,
    staleTime: 5 * 60_000,
  })

export const useApproveCareerStoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tab: CareerStoryTab }) => adminApproveStory(id),
    onSuccess: (_data, { tab }) => queryClient.invalidateQueries({ queryKey: adminKeys.careerStories(tab) }),
  })
}

export const useRejectCareerStoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string; tab: CareerStoryTab }) =>
      adminRejectStory(id, reason),
    onSuccess: (_data, { tab }) => queryClient.invalidateQueries({ queryKey: adminKeys.careerStories(tab) }),
  })
}

export const useUnpublishCareerStoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tab: CareerStoryTab }) => adminUnpublishStory(id),
    onSuccess: (_data, { tab }) => queryClient.invalidateQueries({ queryKey: adminKeys.careerStories(tab) }),
  })
}

export const useCreateCareerStoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminCareerStoryPayload) => adminCreateCareerStory(payload),
    onSuccess: (story: CareerStory) => {
      if (story.status === 'PUBLISHED') {
        queryClient.invalidateQueries({ queryKey: adminKeys.careerStories('PUBLISHED') })
      }
    },
  })
}

// ---------- Reports ----------

const toQuery = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString()

const fetchReportStudents = async (level: 'A_LEVEL' | 'O_LEVEL', page: number): Promise<PagedResult<ReportStudent>> => {
  const { data } = await api.get(`/admin/reports/students?${toQuery({ level, page })}`)
  const d = data.data
  return { data: d.students ?? [], total: d.total, page: d.page, totalPages: d.totalPages }
}

const fetchReportProfessionals = async (type: ReportProfessionalType, page: number): Promise<PagedResult<ReportProfessional>> => {
  const { data } = await api.get(`/admin/reports/professionals?${toQuery({ type, page })}`)
  const d = data.data
  return { data: d.professionals ?? [], total: d.total, page: d.page, totalPages: d.totalPages }
}

const fetchReportCareerGuides = async (page: number, status: 'approved' | 'rejected'): Promise<PagedResult<ReportCareerGuide>> => {
  const { data } = await api.get(`/admin/reports/career-guides?${toQuery({ page, status })}`)
  const d = data.data
  return { data: d.careerGuides ?? [], total: d.total, page: d.page, totalPages: d.totalPages }
}

export const useReportStudentsQuery = (level: 'A_LEVEL' | 'O_LEVEL', page: number) =>
  useQuery({
    queryKey: adminKeys.reportStudents(level, page),
    queryFn: () => fetchReportStudents(level, page),
    placeholderData: keepPreviousData,
  })

export const useReportProfessionalsQuery = (type: ReportProfessionalType, page: number) =>
  useQuery({
    queryKey: adminKeys.reportProfessionals(type, page),
    queryFn: () => fetchReportProfessionals(type, page),
    placeholderData: keepPreviousData,
  })

export const useReportCareerGuidesQuery = (page: number, status: 'approved' | 'rejected' = 'approved') =>
  useQuery({
    queryKey: adminKeys.reportCareerGuides(page, status),
    queryFn: () => fetchReportCareerGuides(page, status),
    placeholderData: keepPreviousData,
  })

export const fetchAllReportStudents = async (level: 'A_LEVEL' | 'O_LEVEL'): Promise<ReportStudent[]> => {
  const { data } = await api.get(`/admin/reports/students?level=${level}&all=true`)
  return data.data.students
}

export const fetchAllReportProfessionals = async (type: ReportProfessionalType): Promise<ReportProfessional[]> => {
  const { data } = await api.get(`/admin/reports/professionals?type=${type}&all=true`)
  return data.data.professionals
}

export const fetchAllReportCareerGuides = async (status: 'approved' | 'rejected' = 'approved'): Promise<ReportCareerGuide[]> => {
  const { data } = await api.get(`/admin/reports/career-guides?status=${status}&all=true`)
  return data.data.careerGuides
}

const fetchReportSummary = async (): Promise<ReportSummary> => {
  const { data } = await api.get('/admin/reports/summary')
  return data.data
}

export const useReportSummaryQuery = () =>
  useQuery({ queryKey: adminKeys.reportSummary, queryFn: fetchReportSummary })

// ---------- Session reports ----------

const fetchSessionReports = async (filter: ReportStatus | 'ALL'): Promise<SessionReport[]> => {
  const params = filter === 'ALL' ? '' : `?status=${filter}`
  const { data } = await api.get(`/admin/session-reports${params}`)
  return data.data ?? []
}

export const useSessionReportsQuery = (filter: ReportStatus | 'ALL') =>
  useQuery({ queryKey: adminKeys.sessionReports(filter), queryFn: () => fetchSessionReports(filter) })

export const useUpdateSessionReportStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      api.patch(`/admin/session-reports/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'session-reports'] }),
  })
}

export const useSuspendProfessionalMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ professionalId, currentlyActive }: { professionalId: string; currentlyActive: boolean }) =>
      api.patch(`/admin/professionals/${professionalId}/${currentlyActive ? 'suspend' : 'reinstate'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'session-reports'] }),
  })
}

// ---------- Careers (admin CRUD) ----------

export const useAdminCareersQuery = () =>
  useQuery<AdminCareer[]>({ queryKey: adminKeys.careers, queryFn: adminListAllCareers })

export const useCreateCareerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CareerUpsertPayload) => adminCreateCareer(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useUpdateCareerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CareerUpsertPayload> & { isActive?: boolean } }) =>
      adminUpdateCareer(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useToggleCareerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminToggleCareer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useDeleteCareerMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminDeleteCareer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useAddStepMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ careerId, payload }: { careerId: string; payload: StepPayload }) =>
      addCareerStep(careerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useUpdateStepMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ careerId, stepId, payload }: { careerId: string; stepId: string; payload: Partial<StepPayload> }) =>
      updateCareerStep(careerId, stepId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

export const useDeleteStepMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ careerId, stepId }: { careerId: string; stepId: string }) =>
      deleteCareerStep(careerId, stepId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.careers }),
  })
}

// ---------- Coverage ----------

export const useAdminCoverageQuery = () =>
  useQuery<CoverageResponse>({ queryKey: adminKeys.coverage, queryFn: getAdminCoverage })

// ---------- Impact ----------

export const useAdminImpactQuery = (schoolId?: string, level?: string) =>
  useQuery<ImpactResponse>({
    queryKey: adminKeys.impact(schoolId, level),
    queryFn: () => getAdminImpact({ schoolId, level }),
  })

// Re-export types consumed by page components
export type { AdminCareer, CoverageResponse, ImpactResponse }
