import { api } from './axios'

export const submitSessionFeedback = async (
  sessionId: string,
  data: {
    confidenceBefore: number
    confidenceAfter: number
    wasHelpful: boolean
    professionalFeedback?: string
  }
) => {
  const res = await api.post(`/sessions/${sessionId}/feedback`, data)
  return res.data.data
}
