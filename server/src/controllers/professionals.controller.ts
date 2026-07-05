import { Request, Response } from 'express'
import * as professionalsService from '../services/professionals.service'
import { ok, badRequest } from '../utils/response'
import { prisma } from '../prisma/client'
import * as emailService from '../services/email.service'

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.getMe(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.updateMe(req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateTiers = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.updateTiers(req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.getAvailability(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const saveAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.saveAvailability(req.auth!.userId, req.body.slots))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.getDashboard(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getQuota = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.getQuota(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const browse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector, sectors, hasFreeIntro, isMentor, combination, page, limit } = req.query
    const isMentorFilter = isMentor === 'true' ? true : isMentor === 'false' ? false : undefined
    ok(res, await professionalsService.browse({
      sector: sector as string,
      sectors: sectors as string | undefined,
      hasFreeIntro: hasFreeIntro === 'true',
      isMentor: isMentorFilter,
      combination: combination as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await professionalsService.getPublicProfile(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const applyToBeMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
      include: { interviewBooking: true, user: { select: { email: true } } },
    })

    if (!professional) {
      badRequest(res, 'Professional not found.')
      return
    }
    if (!professional.isVerified) {
      res.status(403).json({ success: false, error: 'Your account must be verified first.' })
      return
    }
    if (professional.isMentor) {
      res.status(409).json({ success: false, error: 'You are already a mentor.' })
      return
    }
    if (professional.mentorApplicationAttempts >= 3) {
      res.status(403).json({ success: false, error: 'You have reached the maximum number of mentor applications (3).' })
      return
    }
    if (professional.mentorApplicationStatus === 'PENDING') {
      res.status(409).json({ success: false, error: 'You already have a pending application.' })
      return
    }
    if (professional.interviewBooking) {
      res.status(409).json({ success: false, error: 'You already have an interview booked.' })
      return
    }

    const { adminSlotId, scheduledAt, meetLink } = req.body as {
      adminSlotId: string
      scheduledAt: string
      meetLink: string
    }

    const existingBooking = await prisma.mentorApplicationInterviewBooking.findFirst({
      where: { adminSlotId },
    })
    if (existingBooking) {
      res.status(409).json({ success: false, error: 'This slot has already been taken. Please choose another.' })
      return
    }

    await prisma.$transaction([
      prisma.professional.update({
        where: { id: professional.id },
        data: { mentorApplicationStatus: 'PENDING', mentorAppliedAt: new Date(), mentorApplicationAttempts: { increment: 1 }, ...(req.body.mentorBio ? { mentorBio: req.body.mentorBio } : {}) },
      }),
      prisma.mentorApplicationInterviewBooking.create({
        data: {
          professionalId: professional.id,
          adminSlotId,
          scheduledAt: new Date(scheduledAt),
          meetLink,
        },
      }),
    ])

    emailService.notifyAdminNewMentorApplication({
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.user.email,
    }).catch(console.error)

    ok(res, { mentorApplicationStatus: 'PENDING' })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const reapplyVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
      include: { user: { select: { email: true } } },
    })
    if (!professional) { badRequest(res, 'Not found'); return }
    if (professional.verificationAttempts >= 3) {
      res.status(403).json({ success: false, error: 'You have reached the maximum number of verification submissions (3).' })
      return
    }
    const { firstName, lastName, bio, jobTitle, employer, sector, linkedinUrl } = req.body as {
      firstName?: string; lastName?: string; bio?: string; jobTitle?: string; employer?: string; sector?: string; linkedinUrl?: string
    }
    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        verificationStatus: 'PENDING',
        verificationAttempts: { increment: 1 },
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(bio ? { bio } : {}),
        ...(jobTitle ? { jobTitle } : {}),
        ...(employer ? { employer } : {}),
        ...(sector ? { sector } : {}),
        ...(linkedinUrl === undefined ? {} : { linkedinUrl }),
      },
    })
    emailService.notifyAdminNewProfessionalVerification({
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.user.email,
    }).catch(console.error)

    ok(res, { reapplied: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) { badRequest(res, 'Professional not found'); return }
    const slots = await prisma.mentorSlot.findMany({
      where: { professionalId: professional.id },
      include: { Student: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { scheduledAt: 'asc' },
    })
    ok(res, { slots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const createMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) { badRequest(res, 'Professional not found'); return }
    if (!professional.isMentor) { res.status(403).json({ success: false, error: 'Only mentors can create slots.' }); return }
    const { scheduledAt, durationMins, meetLink } = req.body as {
      scheduledAt: string
      durationMins: number
      meetLink?: string
    }
    if (!scheduledAt || !durationMins) { badRequest(res, 'scheduledAt and durationMins are required'); return }
    const slot = await prisma.mentorSlot.create({
      data: {
        id: crypto.randomUUID(),
        professionalId: professional.id,
        scheduledAt: new Date(scheduledAt),
        durationMins,
        meetLink: meetLink ? meetLink.trim() : null,
      },
    })
    ok(res, { slot })
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      res.status(409).json({ success: false, error: 'A slot already exists at that time.' })
      return
    }
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const deleteMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) { badRequest(res, 'Professional not found'); return }
    const slot = await prisma.mentorSlot.findUnique({ where: { id: req.params.slotId } })
    if (!slot || slot.professionalId !== professional.id) { res.status(404).json({ success: false, error: 'Slot not found.' }); return }
    if (slot.isBooked) { res.status(409).json({ success: false, error: 'Cannot delete a booked slot.' }); return }
    await prisma.mentorSlot.delete({ where: { id: slot.id } })
    ok(res, { deleted: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) { badRequest(res, 'Professional not found'); return }
    const slot = await prisma.mentorSlot.findUnique({ where: { id: req.params.slotId } })
    if (!slot || slot.professionalId !== professional.id) { res.status(404).json({ success: false, error: 'Slot not found.' }); return }
    if (slot.isBooked) { res.status(409).json({ success: false, error: 'Cannot edit a booked slot.' }); return }
    const { scheduledAt, durationMins, meetLink } = req.body as {
      scheduledAt: string
      durationMins: number
      meetLink?: string
    }
    if (!scheduledAt || !durationMins) { badRequest(res, 'scheduledAt and durationMins are required'); return }
    const updated = await prisma.mentorSlot.update({
      where: { id: slot.id },
      data: {
        scheduledAt: new Date(scheduledAt),
        durationMins,
        meetLink: meetLink ? meetLink.trim() : null,
      },
    })
    ok(res, { slot: updated })
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      res.status(409).json({ success: false, error: 'A slot already exists at that time.' })
      return
    }
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const createRecurringMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) { badRequest(res, 'Professional not found'); return }
    if (!professional.isMentor) { res.status(403).json({ success: false, error: 'Only mentors can create slots.' }); return }
    const { daysOfWeek, startHour, startMinute, endHour, endMinute, meetLink, weeks } = req.body as {
      daysOfWeek: number[]
      startHour: number
      startMinute: number
      endHour: number
      endMinute: number
      meetLink: string
      weeks: number
    }
    const result = await professionalsService.createRecurringMentorSlots(professional.id, {
      daysOfWeek, startHour, startMinute, endHour, endMinute, meetLink, weeks,
    })
    ok(res, result)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPublicMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slots = await prisma.mentorSlot.findMany({
      where: {
        professionalId: req.params.id,
        isBooked: false,
        scheduledAt: { gt: new Date() },
      },
      select: { id: true, scheduledAt: true, durationMins: true },
      orderBy: { scheduledAt: 'asc' },
    })
    ok(res, { slots: slots.map(s => ({ id: s.id, scheduledAt: s.scheduledAt, duration: s.durationMins })) })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getApprovedMentors = async (req: Request, res: Response): Promise<void> => {  try {
    const { sector } = req.query
    const where: Record<string, unknown> = {
      isVerified: true,
      isMentor: true,
      isActive: true,
    }
    if (sector) where.sector = String(sector)

    const mentors = await prisma.professional.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        employer: true,
        sector: true,
        bio: true,
        profilePhoto: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    ok(res, { professionals: mentors })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
