import { api } from '@/api/axios'
import type { StreamCode } from '@/constants/streams'

export interface StreamSupply {
  mentorCount: number
  groupSessionCount: number
  storyCount: number
}

export type StreamSupplyMap = Record<StreamCode, StreamSupply>

export const getStreamSupply = (): Promise<StreamSupplyMap> =>
  api.get('/students/stream-supply').then((r) => r.data.data)

export interface QuizResultPayload {
  answers: Record<string, number>
  scores: Record<string, number>
  topPathways: string[]
}

export const saveQuizResult = (payload: QuizResultPayload) =>
  api.post('/students/me/quiz-result', payload).then((r) => r.data.data)
