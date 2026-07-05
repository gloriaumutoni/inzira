import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    student: { findUnique: vi.fn() },
    professional: { findUnique: vi.fn() },
    mentorSlot: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    session: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('./email.service', () => ({
  notifyProfessionalNewSessionRequest: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../prisma/client'
import { create } from './sessions.service'

const student = { id: 'student-1', userId: 'user-student-1' }

const baseProfessional = {
  id: 'pro-1',
  isVerified: true,
  isActive: true,
  proRate: 5000,
  premiumRate: 10000,
  premiumSessionsPerMonth: 2,
  sessionQuota: 20,
  sessionsUsedThisMonth: 0,
  firstName: 'Ada',
  user: { email: 'ada@example.com' },
}

function mockPrisma() {
  return prisma as unknown as {
    student: { findUnique: ReturnType<typeof vi.fn> }
    professional: { findUnique: ReturnType<typeof vi.fn> }
    mentorSlot: { count: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    session: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  }
}

describe('sessions.service create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p = mockPrisma()
    p.student.findUnique.mockResolvedValue(student)
    p.professional.findUnique.mockResolvedValue(baseProfessional)
    p.mentorSlot.count.mockResolvedValue(0)
    p.session.findFirst.mockResolvedValue(null)
    p.session.create.mockImplementation(async ({ data }: any) => ({ ...data, id: 'session-1' }))
  })

  const validData = {
    professionalId: 'pro-1',
    type: 'PRO' as const,
    scheduledAt: '2026-08-01T10:00:00.000Z',
    duration: 30,
  }

  it('computes 0 gross/commission/net for FREE_INTRO', async () => {
    const session = await create('user-student-1', { ...validData, type: 'FREE_INTRO' })
    expect(session.grossAmount).toBe(0)
    expect(session.commissionAmount).toBe(0)
    expect(session.netAmount).toBe(0)
  })

  it('computes flat proRate as gross for PRO regardless of premium fields', async () => {
    const session = await create('user-student-1', { ...validData, type: 'PRO' })
    expect(session.grossAmount).toBe(5000)
    expect(session.commissionAmount).toBe(Math.round(5000 * 0.15))
    expect(session.netAmount).toBe(5000 - Math.round(5000 * 0.15))
  })

  it('computes gross for PREMIUM as premiumRate divided across sessions per month', async () => {
    const session = await create('user-student-1', { ...validData, type: 'PREMIUM' })
    expect(session.grossAmount).toBe(Math.round(10000 / 2))
  })

  it('documents the premiumSessionsPerMonth=0 divide-by-zero edge case', async () => {
    mockPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, premiumSessionsPerMonth: 0 })
    const session = await create('user-student-1', { ...validData, type: 'PREMIUM' })
    expect(session.grossAmount).toBe(Infinity)
    expect(Number.isNaN(session.netAmount)).toBe(true)
  })

  it('rejects a 4th upcoming booking when the student already has 3', async () => {
    mockPrisma().mentorSlot.count.mockResolvedValue(3)
    await expect(create('user-student-1', validData)).rejects.toThrow(/already have 3 upcoming/i)
  })

  it('rejects a second FREE_INTRO with the same professional', async () => {
    mockPrisma().session.findFirst.mockResolvedValue({ id: 'existing-session' })
    await expect(create('user-student-1', { ...validData, type: 'FREE_INTRO' })).rejects.toThrow(/already had a free intro/i)
  })

  it('rejects booking once the professional has hit their monthly quota', async () => {
    mockPrisma().professional.findUnique.mockResolvedValue({
      ...baseProfessional,
      sessionsUsedThisMonth: 20,
      sessionQuota: 20,
    })
    await expect(create('user-student-1', validData)).rejects.toThrow(/reached their session limit/i)
  })

  it('rejects booking a slot that is already booked', async () => {
    mockPrisma().mentorSlot.findUnique.mockResolvedValue({
      id: 'slot-1',
      isBooked: true,
      professionalId: 'pro-1',
      scheduledAt: new Date(),
      durationMins: 30,
    })
    await expect(
      create('user-student-1', { type: 'PRO', slotId: 'slot-1' }),
    ).rejects.toThrow(/already booked/i)
  })

  it('rejects when the student does not exist', async () => {
    mockPrisma().student.findUnique.mockResolvedValue(null)
    await expect(create('missing-user', validData)).rejects.toThrow(/Student not found/i)
  })

  it('rejects when the professional is unverified or inactive', async () => {
    mockPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, isVerified: false })
    await expect(create('user-student-1', validData)).rejects.toThrow(/not available/i)
  })
})
