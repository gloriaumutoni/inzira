import { api } from './axios'

export interface CareerStoryProfessional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  profilePhoto: string | null
}

export interface CareerStory {
  id: string
  professionalId: string
  professional: CareerStoryProfessional
  jobTitle: string
  sector: string
  streamCodes: string[]
  combinations: string[]
  myPath: string
  whatIDo: string
  adviceForStudents: string
  universityStudied: string | null
  program: string | null
  entryRequirements: string | null
  firstJobStep: string | null
  yearsToGetThere: number | null
  keySkills: string[]
  linkedCareerId: string | null
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'
  rejectionReason: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CareerStoryListResponse {
  stories: CareerStory[]
  total: number
  page: number
  limit: number
}

export interface CareerStoryPayload {
  jobTitle: string
  sector: string
  streamCodes: string[]
  combinations: string[]
  myPath: string
  whatIDo: string
  adviceForStudents: string
  universityStudied: string
  program: string
  entryRequirements: string
  firstJobStep: string
  yearsToGetThere: number | ''
  keySkills: string[]
  linkedCareerId: string
}

export const listCareerStories = async (params?: {
  stream?: string
  combination?: string
  sector?: string
  search?: string
  interests?: string
  page?: number
  limit?: number
}): Promise<CareerStoryListResponse> => {
  const { data } = await api.get('/career-stories', { params })
  return data.data
}

export const getCareerStory = async (id: string): Promise<CareerStory> => {
  const { data } = await api.get(`/career-stories/${id}`)
  return data.data
}

export const getMyCareerStories = async (): Promise<CareerStory[]> => {
  const { data } = await api.get('/career-stories/me')
  return data.data
}

// Optional roadmap-detail fields are edited as empty strings in the form;
// strip them to undefined so the API receives null/omitted, not "".
const serializeStoryPayload = (payload: Partial<CareerStoryPayload>) => ({
  ...payload,
  universityStudied: payload.universityStudied || undefined,
  program: payload.program || undefined,
  entryRequirements: payload.entryRequirements || undefined,
  firstJobStep: payload.firstJobStep || undefined,
  yearsToGetThere: payload.yearsToGetThere === '' || payload.yearsToGetThere === undefined ? undefined : payload.yearsToGetThere,
  linkedCareerId: payload.linkedCareerId || undefined,
})

export const createCareerStory = async (payload: CareerStoryPayload): Promise<CareerStory> => {
  const { data } = await api.post('/career-stories', serializeStoryPayload(payload))
  return data.data
}

export const updateCareerStory = async (
  id: string,
  payload: Partial<CareerStoryPayload>
): Promise<CareerStory> => {
  const { data } = await api.patch(`/career-stories/${id}`, serializeStoryPayload(payload))
  return data.data
}

export const getCombinations = async (): Promise<string[]> => {
  const { data } = await api.get('/career-stories/combinations')
  return data.data
}

export const adminListPendingStories = async (): Promise<CareerStory[]> => {
  const { data } = await api.get('/admin/career-stories', { params: { status: 'PENDING_REVIEW' } })
  return data.data
}

export const adminListStoriesByStatus = async (
  status: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'
): Promise<CareerStory[]> => {
  const { data } = await api.get('/admin/career-stories', { params: { status } })
  return data.data
}

export const adminApproveStory = async (id: string): Promise<CareerStory> => {
  const { data } = await api.patch(`/admin/career-stories/${id}/approve`)
  return data.data
}

export const adminRejectStory = async (id: string, rejectionReason: string): Promise<CareerStory> => {
  const { data } = await api.patch(`/admin/career-stories/${id}/reject`, { rejectionReason })
  return data.data
}

export const adminUnpublishStory = async (id: string): Promise<CareerStory> => {
  const { data } = await api.patch(`/admin/career-stories/${id}/unpublish`)
  return data.data
}

export interface VerifiedProfessional {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  sector: string
}

export const adminListVerifiedProfessionals = async (): Promise<VerifiedProfessional[]> => {
  const { data } = await api.get('/admin/career-stories/professionals/verified')
  return data.data
}

export interface AdminCareerStoryPayload extends Pick<CareerStoryPayload, 'jobTitle' | 'sector' | 'combinations' | 'myPath' | 'whatIDo' | 'adviceForStudents'> {
  professionalId: string
}

export const adminCreateCareerStory = async (payload: AdminCareerStoryPayload): Promise<CareerStory> => {
  const { data } = await api.post('/admin/career-stories', payload)
  return data.data
}
