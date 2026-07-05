export type Role = 'STUDENT' | 'PROFESSIONAL' | 'CAREER_GUIDE' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: Role
  student?: StudentProfile | null
  professional?: ProfessionalProfile | null
  careerGuide?: CareerGuideProfile | null
}

export interface StudentProfile {
  id: string
  firstName: string
  lastName: string
  level: 'O_LEVEL' | 'A_LEVEL'
  schoolYear: string
  combination?: string | null
  pathway?: string | null
  confidenceLevel?: number | null
  mentorPlan: 'FREE' | 'PRO' | 'PREMIUM'
  interests: string[]
  profilePhoto?: string | null
  schoolId?: string | null
  combinationsConsidering: string[]
  careerInterests: string[]
  onboardingCompleted: boolean
}

export interface ProfessionalProfile {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  bio: string
  linkedinUrl?: string | null
  isVerified: boolean
  isActive: boolean
  proRate: number
  premiumRate: number
  offersFreeIntro: boolean
  offersProTier: boolean
  offersPremiumTier: boolean
  isMentor?: boolean
  mentorApplicationStatus?: string | null
  mentorRejectionReason?: string | null
  mentorRejectionCount?: number
  mentorBio?: string | null
  mentorApplicationAttempts?: number
  verificationStatus?: string
  rejectionReason?: string | null
  rejectionCount?: number
  verificationAttempts?: number
  relevantCombinations?: string[]
  interviewBooking?: {
    scheduledAt: string
    meetLink: string
  } | null
}

export interface CareerGuideProfile {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  linkedinUrl?: string | null
  isVerified: boolean
  verificationStatus?: string
  rejectionReason?: string | null
  rejectionCount?: number
  verificationAttempts?: number
  schoolId?: string | null
}

export interface School {
  id: string
  name: string
  district: string
}

export interface Career {
  id: string
  title: string
  description: string
  sector: string
  combinations: string[]
  isActive: boolean
}

export interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: Role
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}
