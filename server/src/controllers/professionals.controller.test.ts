import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'

vi.mock('../prisma/client', () => ({
  prisma: {
    professional: { findUnique: vi.fn(), update: vi.fn() },
    mentorApplicationInterviewBooking: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('../services/email.service', () => ({
  notifyAdminNewMentorApplication: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../prisma/client'
import { applyToBeMentor } from './professionals.controller'

function mockedPrisma() {
  return prisma as unknown as {
    professional: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
    mentorApplicationInterviewBooking: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
    $transaction: ReturnType<typeof vi.fn>
  }
}

function mockRes() {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

function mockReq(body: Record<string, unknown> = {}) {
  return { auth: { userId: 'user-1' }, body } as unknown as Request
}

const baseProfessional = {
  id: 'pro-1',
  firstName: 'Ada',
  lastName: 'K',
  isVerified: true,
  isMentor: false,
  mentorApplicationAttempts: 0,
  mentorApplicationStatus: null,
  interviewBooking: null,
  user: { email: 'ada@example.com' },
}

describe('professionals.controller applyToBeMentor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedPrisma().professional.findUnique.mockResolvedValue(baseProfessional)
    mockedPrisma().mentorApplicationInterviewBooking.findFirst.mockResolvedValue(null)
    mockedPrisma().$transaction.mockResolvedValue([{}, {}])
  })

  it('rejects an unverified professional with 403', async () => {
    mockedPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, isVerified: false })
    const res = mockRes()
    await applyToBeMentor(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('rejects a professional who is already a mentor with 409', async () => {
    mockedPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, isMentor: true })
    const res = mockRes()
    await applyToBeMentor(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('rejects after 3 application attempts with 403', async () => {
    mockedPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, mentorApplicationAttempts: 3 })
    const res = mockRes()
    await applyToBeMentor(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('rejects a professional with a pending application with 409', async () => {
    mockedPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, mentorApplicationStatus: 'PENDING' })
    const res = mockRes()
    await applyToBeMentor(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('rejects a professional who already has an interview booked with 409', async () => {
    mockedPrisma().professional.findUnique.mockResolvedValue({ ...baseProfessional, interviewBooking: { id: 'booking-1' } })
    const res = mockRes()
    await applyToBeMentor(mockReq(), res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('rejects when the chosen admin slot is already taken with 409', async () => {
    mockedPrisma().mentorApplicationInterviewBooking.findFirst.mockResolvedValue({ id: 'existing-booking' })
    const res = mockRes()
    await applyToBeMentor(
      mockReq({ adminSlotId: 'slot-1', scheduledAt: '2026-08-01T10:00:00.000Z', meetLink: 'https://meet.google.com/x' }),
      res,
    )
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('submits the application and books the interview on the happy path', async () => {
    const res = mockRes()
    await applyToBeMentor(
      mockReq({ adminSlotId: 'slot-1', scheduledAt: '2026-08-01T10:00:00.000Z', meetLink: 'https://meet.google.com/x' }),
      res,
    )
    expect(mockedPrisma().$transaction).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { mentorApplicationStatus: 'PENDING' } }),
    )
  })
})
