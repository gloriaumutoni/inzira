import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { ok, badRequest } from '../utils/response'

export const createMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
    })
    if (!professional?.isMentor) {
      res.status(403).json({ success: false, error: 'Mentors only.' })
      return
    }

    const { scheduledAt, endAt, meetLink } = req.body as {
      scheduledAt: string
      endAt: string
      meetLink: string
    }

    const existing = await prisma.mentorSlot.findFirst({
      where: { professionalId: professional.id, scheduledAt: new Date(scheduledAt) },
    })
    if (existing) {
      res.status(409).json({ success: false, error: 'You already have a slot at this time.' })
      return
    }

    const durationMins = Math.round(
      (new Date(endAt).getTime() - new Date(scheduledAt).getTime()) / 60000
    )

    const slot = await prisma.mentorSlot.create({
      data: {
        id: crypto.randomUUID(),
        professionalId: professional.id,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        meetLink,
        isBooked: false,
      },
    })

    ok(res, slot)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const deleteMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const slot = await prisma.mentorSlot.findUnique({ where: { id: req.params.id } })
    if (!slot) {
      res.status(404).json({ success: false, error: 'Slot not found.' })
      return
    }
    if (slot.isBooked) {
      res.status(400).json({ success: false, error: 'Cannot delete a slot that has already been booked.' })
      return
    }
    await prisma.mentorSlot.delete({ where: { id: req.params.id } })
    ok(res, { deleted: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMyMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
    })
    if (!professional?.isMentor) {
      res.status(403).json({ success: false, error: 'Mentors only.' })
      return
    }

    const slots = await prisma.mentorSlot.findMany({
      where: { professionalId: professional.id },
      include: {
        Student: {
          select: { firstName: true, lastName: true, level: true, combination: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    ok(res, { slots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAvailableMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slots = await prisma.mentorSlot.findMany({
      where: {
        professionalId: req.params.professionalId,
        isBooked: false,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    ok(res, {
      slots: slots.map((s) => ({
        id: s.id,
        scheduledAt: s.scheduledAt,
        durationMins: s.durationMins,
      })),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
