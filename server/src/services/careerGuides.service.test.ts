import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    careerGuide: { findUnique: vi.fn() },
    student: { findMany: vi.fn() },
  },
}))

import { prisma } from '../prisma/client'
import { getDashboard } from './careerGuides.service'

function mockedPrisma() {
  return prisma as unknown as {
    careerGuide: { findUnique: ReturnType<typeof vi.fn> }
    student: { findMany: ReturnType<typeof vi.fn> }
  }
}

const guide = { id: 'guide-1', userId: 'user-guide-1', schoolId: 'school-1', school: { id: 'school-1', name: 'GS Kigali' } }

function student(confidenceLevel: number | null) {
  return {
    id: `student-${confidenceLevel}`,
    level: 'A_LEVEL',
    combination: 'MPC',
    confidenceLevel,
    confidenceLogs: [],
    sessions: [],
    groupEnrolments: [],
  }
}

describe('careerGuides.service getDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPrisma().careerGuide.findUnique.mockResolvedValue(guide)
  })

  it('returns avgConfidence 0 when the school has no students', async () => {
    mockedPrisma().student.findMany.mockResolvedValue([])
    const result = await getDashboard('user-guide-1')
    expect(result.totalStudents).toBe(0)
    expect(result.avgConfidence).toBe(0)
  })

  it('counts students with a null confidenceLevel as 0 in the average', async () => {
    mockedPrisma().student.findMany.mockResolvedValue([student(10), student(null)])
    const result = await getDashboard('user-guide-1')
    expect(result.avgConfidence).toBe(5) // (10 + 0) / 2
  })

  it('computes a plain average when all students have a confidence score', async () => {
    mockedPrisma().student.findMany.mockResolvedValue([student(4), student(6), student(8)])
    const result = await getDashboard('user-guide-1')
    expect(result.avgConfidence).toBe(6)
  })

  it('throws when the career guide has no school assigned', async () => {
    mockedPrisma().careerGuide.findUnique.mockResolvedValue({ ...guide, schoolId: null })
    await expect(getDashboard('user-guide-1')).rejects.toThrow(/career guide or school not found/i)
  })

  it('throws when the career guide does not exist', async () => {
    mockedPrisma().careerGuide.findUnique.mockResolvedValue(null)
    await expect(getDashboard('missing-user')).rejects.toThrow(/career guide or school not found/i)
  })
})
