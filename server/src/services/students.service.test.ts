import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    student: { findUnique: vi.fn(), update: vi.fn() },
    session: { findMany: vi.fn() },
    groupSessionEnrolment: { findMany: vi.fn() },
    confidenceLog: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

import { prisma } from '../prisma/client'
import { getDashboard, logConfidence } from './students.service'

function mockedPrisma() {
  return prisma as unknown as {
    student: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    session: { findMany: ReturnType<typeof vi.fn> }
    groupSessionEnrolment: { findMany: ReturnType<typeof vi.fn> }
    confidenceLog: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  }
}

describe('students.service logConfidence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPrisma().student.findUnique.mockResolvedValue({ id: 'student-1', userId: 'user-1' })
    mockedPrisma().confidenceLog.create.mockResolvedValue({ id: 'log-1', score: 7 })
    mockedPrisma().student.update.mockResolvedValue({ id: 'student-1', confidenceLevel: 7 })
  })

  it('writes a ConfidenceLog row and denormalizes the latest score onto the student', async () => {
    await logConfidence('user-1', 7, 'feeling good', 'MPC')

    expect(mockedPrisma().confidenceLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ studentId: 'student-1', score: 7, combination: 'MPC' }),
    })
    expect(mockedPrisma().student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { confidenceLevel: 7 },
    })
  })

  it('throws when the student does not exist', async () => {
    mockedPrisma().student.findUnique.mockResolvedValue(null)
    await expect(logConfidence('missing-user', 5)).rejects.toThrow(/student not found/i)
  })
})

describe('students.service getDashboard confidence fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPrisma().session.findMany.mockResolvedValue([])
    mockedPrisma().groupSessionEnrolment.findMany.mockResolvedValue([])
  })

  it('synthesizes an "initial" confidence entry when no ConfidenceLog rows exist yet', async () => {
    mockedPrisma().student.findUnique.mockResolvedValue({
      id: 'student-1',
      confidenceLevel: 6,
      createdAt: new Date('2026-01-01'),
    })
    mockedPrisma().confidenceLog.findFirst.mockResolvedValue(null)

    const result = await getDashboard('user-1')
    expect(result.latestConfidence).toEqual(
      expect.objectContaining({ id: 'initial', score: 6 }),
    )
  })

  it('returns null latestConfidence when there are no logs and no baseline confidenceLevel', async () => {
    mockedPrisma().student.findUnique.mockResolvedValue({
      id: 'student-1',
      confidenceLevel: null,
      createdAt: new Date('2026-01-01'),
    })
    mockedPrisma().confidenceLog.findFirst.mockResolvedValue(null)

    const result = await getDashboard('user-1')
    expect(result.latestConfidence).toBeNull()
  })

  it('prefers the most recent real ConfidenceLog row over the synthesized fallback', async () => {
    mockedPrisma().student.findUnique.mockResolvedValue({
      id: 'student-1',
      confidenceLevel: 6,
      createdAt: new Date('2026-01-01'),
    })
    const realLog = { id: 'log-42', score: 9, note: null, createdAt: new Date('2026-02-01') }
    mockedPrisma().confidenceLog.findFirst.mockResolvedValue(realLog)

    const result = await getDashboard('user-1')
    expect(result.latestConfidence).toEqual(realLog)
  })
})
