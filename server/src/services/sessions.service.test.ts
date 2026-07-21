import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../prisma/client', () => ({
  prisma: {
    student: { findUnique: vi.fn() },
    professional: { findUnique: vi.fn() },
    mentorSlot: { count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    session: { create: vi.fn() },
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
    session: { create: ReturnType<typeof vi.fn> }
  }
}

describe('sessions.service create()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const p = mockPrisma()
    p.student.findUnique.mockResolvedValue(student)
    p.professional.findUnique.mockResolvedValue(baseProfessional)
    p.mentorSlot.count.mockResolvedValue(0)
    p.session.create.mockImplementation(async ({ data }: any) => ({ ...data, id: 'session-1' }))
  })

  const validData = {
    professionalId: 'pro-1',
    scheduledAt: '2026-08-01T10:00:00.000Z',
    duration: 30,
  }

  it('rejects a 4th upcoming booking when the student already has 3', async () => {
    mockPrisma().mentorSlot.count.mockResolvedValue(3)
    await expect(create('user-student-1', validData)).rejects.toThrow(/already have 3 upcoming/i)
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
      create('user-student-1', { slotId: 'slot-1' }),
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
