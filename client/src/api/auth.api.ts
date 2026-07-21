import { api } from './axios'
import { AuthResponse, User } from '../types'

export interface SignupPayload {
  email: string
  password: string
  role: string
  firstName: string
  lastName: string
  level?: string
  schoolYear?: string
  combination?: string
  jobTitle?: string
  employer?: string
  sector?: string
  bio?: string
  schoolId?: string
  linkedinUrl?: string
  careerInterests?: string[]
  combinationsConsidering?: string[]
  relevantCombinations?: string[]
  referredById?: string
}

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { email, password })
  return data.data
}

export const signupUser = async (
  payload: SignupPayload
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/signup', payload)
  return data.data
}

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me')
  return data.data
}

export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout')
}

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const { data } = await api.post('/auth/refresh')
  return data.data
}
