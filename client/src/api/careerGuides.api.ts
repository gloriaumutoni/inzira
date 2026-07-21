import { api } from './axios'
import type { StreamCode } from '@/constants/streams'

export interface CohortQuizSummary {
  totalStudents: number
  quizzedCount: number
  streamDistribution: Record<StreamCode, number>
  confidenceTrend: { week: string; avgConfidence: number }[]
}

export interface CareerGuideImpact {
  signups: number
  quizCompletions: number
  streamChosenCount: number
  avgConfidenceStart: number
  avgConfidenceLatest: number
  deltaConfidence: number
}

export const getCohortQuizSummary = async (): Promise<CohortQuizSummary> => {
  const { data } = await api.get('/career-guides/me/cohort-quiz-summary')
  return data.data
}

export const getCareerGuideImpact = async (): Promise<CareerGuideImpact> => {
  const { data } = await api.get('/career-guides/me/impact')
  return data.data
}
