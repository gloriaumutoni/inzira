import { useQuery } from '@tanstack/react-query'
import { getCohortQuizSummary, getCareerGuideImpact } from '@/api/careerGuides.api'

export const careerGuideQueryKeys = {
  cohortQuizSummary: ['career-guides', 'me', 'cohort-quiz-summary'] as const,
  impact: ['career-guides', 'me', 'impact'] as const,
}

export const useCohortQuizSummary = () =>
  useQuery({ queryKey: careerGuideQueryKeys.cohortQuizSummary, queryFn: getCohortQuizSummary })

export const useCareerGuideImpact = () =>
  useQuery({ queryKey: careerGuideQueryKeys.impact, queryFn: getCareerGuideImpact })
