import { api } from './axios'

export interface Career {
  id: string
  title: string
  description: string
  sector: string
  streamCodes: string[]
  combinations: string[]
  pathwayCodes: string[]
  keySkills: string[]
  isActive: boolean
}

export interface CareerListResponse {
  careers: Career[]
  total: number
  page: number
  limit: number
}

export type Reachability = 'DIRECT' | 'STRETCH'

export interface CareerCard {
  id: string
  title: string
  sector: string
  shortDescription: string
  reachability: Reachability
  mentorCount: number
  storyCount: number
}

export interface ReachableCareersResponse {
  fromStream: string | null
  fromCombination: string | null
  reachable: CareerCard[]
  stretch: CareerCard[]
}

export interface UniversityProgram {
  program: string
  institutions?: string[]
  entryRequirements?: string
  durationYears?: number
  indicativeCostRwf?: number
}

export interface RoadmapStep {
  order: number
  title: string
  detail: string
  timeframe: string | null
}

export interface RoadmapMentor {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  profilePhoto: string | null
}

export interface RoadmapStory {
  id: string
  jobTitle: string
  sector: string
  streamCodes: string[]
  combinations: string[]
  myPath: string
  universityStudied: string | null
  program: string | null
  entryRequirements: string | null
  firstJobStep: string | null
  yearsToGetThere: number | null
  keySkills: string[]
  linkedCareerId: string | null
  professional: {
    id: string
    firstName: string
    lastName: string
    jobTitle: string
    employer: string
    profilePhoto: string | null
  }
}

export interface CareerRoadmap {
  id: string
  title: string
  sector: string
  description: string
  requiredStreams: string[]
  requiredCombinations: string[]
  typicalPathways: string[]
  universityPrograms: UniversityProgram[]
  steps: RoadmapStep[]
  keySkills: string[]
  mentors: RoadmapMentor[]
  stories: RoadmapStory[]
}

export const listCareers = async (params?: {
  sector?: string
  combination?: string
  page?: number
  limit?: number
}): Promise<CareerListResponse> => {
  const { data } = await api.get('/careers', { params })
  return data.data
}

export const getCareerRoadmap = async (id: string): Promise<CareerRoadmap> => {
  const { data } = await api.get(`/careers/${id}/roadmap`)
  return data.data
}

export const getReachableCareers = async (): Promise<ReachableCareersResponse> => {
  const { data } = await api.get('/careers/reachable-from-stream')
  return data.data
}

// ── Admin career CRUD ────────────────────────────────────────────────────────

export interface AdminCareer extends Career {
  universityPrograms: UniversityProgram[] | null
  roadmapSteps: RoadmapStep[]
  isActive: boolean
  createdAt: string
}

export interface CareerUpsertPayload {
  title: string
  description: string
  sector: string
  streamCodes: string[]
  combinations?: string[]
  pathwayCodes?: string[]
  universityPrograms?: UniversityProgram[]
  keySkills?: string[]
}

export const adminListAllCareers = async (): Promise<AdminCareer[]> => {
  const { data } = await api.get('/careers/admin/all')
  return data.data
}

export const adminCreateCareer = async (payload: CareerUpsertPayload): Promise<AdminCareer> => {
  const { data } = await api.post('/careers', payload)
  return data.data
}

export const adminUpdateCareer = async (id: string, payload: Partial<CareerUpsertPayload> & { isActive?: boolean }): Promise<AdminCareer> => {
  const { data } = await api.patch(`/careers/${id}`, payload)
  return data.data
}

export const adminToggleCareer = async (id: string): Promise<AdminCareer> => {
  const { data } = await api.patch(`/careers/${id}/toggle`)
  return data.data
}

export const adminDeleteCareer = async (id: string): Promise<void> => {
  await api.delete(`/careers/${id}`)
}

// ── Roadmap steps ────────────────────────────────────────────────────────────

export interface StepPayload {
  order: number
  title: string
  detail: string
  timeframe?: string
}

export const addCareerStep = async (careerId: string, payload: StepPayload): Promise<RoadmapStep & { id: string }> => {
  const { data } = await api.post(`/careers/${careerId}/steps`, payload)
  return data.data
}

export const updateCareerStep = async (careerId: string, stepId: string, payload: Partial<StepPayload>): Promise<RoadmapStep & { id: string }> => {
  const { data } = await api.patch(`/careers/${careerId}/steps/${stepId}`, payload)
  return data.data
}

export const deleteCareerStep = async (careerId: string, stepId: string): Promise<void> => {
  await api.delete(`/careers/${careerId}/steps/${stepId}`)
}

// ── Coverage & Impact ────────────────────────────────────────────────────────

export interface StreamCoverage {
  streamCode: string
  streamName: string
  mentorCount: number
  storyCount: number
  careerCount: number
  gap: boolean
}

export interface CareerCoverage {
  careerId: string
  title: string
  mentorCount: number
  storyCount: number
  hasRoadmap: boolean
}

export interface CoverageResponse {
  byStream: StreamCoverage[]
  byCareer: CareerCoverage[]
  emptyStreams: string[]
  careersMissingRoadmap: string[]
}

export interface ImpactFunnel {
  signups: number
  quizCompletions: number
  streamChosen: number
  mentorSessionsBooked: number
}

export interface ImpactConfidence {
  avgStart: number
  avgLatest: number
  delta: number
}

export interface SchoolImpact {
  schoolId: string
  schoolName: string
  signups: number
  quizCompletions: number
  avgDelta: number
}

export interface ImpactResponse {
  funnel: ImpactFunnel
  confidence: ImpactConfidence
  bySchool: SchoolImpact[]
}

export const getAdminCoverage = async (): Promise<CoverageResponse> => {
  const { data } = await api.get('/admin/coverage')
  return data.data
}

export const getAdminImpact = async (params?: { schoolId?: string; level?: string }): Promise<ImpactResponse> => {
  const { data } = await api.get('/admin/impact', { params })
  return data.data
}
