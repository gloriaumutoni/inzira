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
  combinations: string[]
  myPath: string
  whatIDo: string
  adviceForStudents: string
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
  combinations: string[]
  myPath: string
  whatIDo: string
  adviceForStudents: string
}

export const listCareerStories = async (params?: {
  combination?: string
  sector?: string
  search?: string
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

export const createCareerStory = async (payload: CareerStoryPayload): Promise<CareerStory> => {
  const { data } = await api.post('/career-stories', payload)
  return data.data
}

export const updateCareerStory = async (
  id: string,
  payload: Partial<CareerStoryPayload>
): Promise<CareerStory> => {
  const { data } = await api.patch(`/career-stories/${id}`, payload)
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

export interface AdminCareerStoryPayload extends CareerStoryPayload {
  professionalId: string
}

export const adminCreateCareerStory = async (payload: AdminCareerStoryPayload): Promise<CareerStory> => {
  const { data } = await api.post('/admin/career-stories', payload)
  return data.data
}
