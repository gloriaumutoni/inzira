import { Request, Response } from 'express'
import * as professionalsService from '../services/professionals.service'
import { ok, badRequest } from '../utils/response'
import { prisma } from '../prisma/client'
import { sendAdminVerificationAlert } from '../services/email.service'
import { expandWeeklyTemplate } from '../utils/slots'

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
    const { sector, hasFreeIntro, page, limit } = req.query
    ok(res, await professionalsService.browse({
      sector: sector as string,
      hasFreeIntro: hasFreeIntro === 'true',
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

export const getRecommendedProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    const professionals = await professionalsService.getRecommended(req.auth!.userId)
    ok(res, { professionals })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const applyToBeMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
      include: { user: { select: { email: true } }, interviewBooking: true },
    })

    if (!professional?.isVerified) {
      res.status(403).json({ success: false, error: 'Only verified professionals can apply to be mentors.' })
      return
    }

    if (
      professional.mentorApplicationStatus === 'PENDING' ||
      professional.mentorApplicationStatus === 'INTERVIEWED'
    ) {
      res.status(409).json({ success: false, error: 'You already have an active mentor application.' })
      return
    }

    if (professional.isMentor) {
      res.status(409).json({ success: false, error: 'You are already a mentor.' })
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
      res.status(409).json({ success: false, error: 'This interview slot was just taken. Please pick another.' })
      return
    }

    await prisma.$transaction([
      prisma.professional.update({
        where: { id: professional.id },
        data: { mentorApplicationStatus: 'PENDING', mentorAppliedAt: new Date() },
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

    await sendAdminVerificationAlert({
      roleLabel: 'Mentor Application',
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.user.email,
      linkedinUrl: professional.linkedinUrl,
    })

    res.json({ success: true, data: { mentorApplicationStatus: 'PENDING' } })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateMyCareers = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
    })
    if (!professional) {
      res.status(404).json({ success: false, error: 'Professional not found.' })
      return
    }

    const { careerIds } = req.body as { careerIds: string[] }

    await prisma.professionalCareer.deleteMany({ where: { professionalId: professional.id } })
    if (careerIds.length > 0) {
      await prisma.professionalCareer.createMany({
        data: careerIds.map((careerId) => ({ professionalId: professional.id, careerId })),
        skipDuplicates: true,
      })
    }

    res.json({ success: true, data: { careerIds } })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMyAvailabilityTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional) {
      res.status(404).json({ success: false, error: 'Not found.' })
      return
    }
    const templates = await prisma.mentorAvailabilityTemplate.findMany({
      where: { professionalId: professional.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    })
    ok(res, { templates })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const addAvailabilityTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({ where: { userId: req.auth!.userId } })
    if (!professional?.isMentor) {
      res.status(403).json({ success: false, error: 'Only approved mentors can set availability.' })
      return
    }
    const { dayOfWeek, startHour, startMinute, endHour, endMinute } = req.body
    const template = await prisma.mentorAvailabilityTemplate.create({
      data: { professionalId: professional.id, dayOfWeek, startHour, startMinute, endHour, endMinute },
    })
    ok(res, template)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const deleteAvailabilityTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.mentorAvailabilityTemplate.delete({ where: { id: req.params.id } })
    ok(res, { deleted: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getApprovedMentors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector, combination } = req.query

    const mentors = await prisma.professional.findMany({
      where: {
        isMentor: true,
        isVerified: true,
        isActive: true,
        ...(sector ? { sector: String(sector) } : {}),
        ...(combination
          ? {
              careers: {
                some: {
                  career: {
                    combinations: { has: String(combination) },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        careers: { include: { career: { select: { title: true, sector: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    ok(res, {
      mentors: mentors.map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        jobTitle: m.jobTitle,
        employer: m.employer,
        sector: m.sector,
        bio: m.bio,
        careers: m.careers.map((c) => c.career.title),
      })),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMentorOpenSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { id: req.params.id },
      include: { availabilityTemplates: true },
    })
    if (!professional?.isMentor) {
      res.status(404).json({ success: false, error: 'Mentor not found.' })
      return
    }
    const expandedSlots = expandWeeklyTemplate(professional.availabilityTemplates)
    const bookedSlots = await prisma.mentorSlot.findMany({
      where: { professionalId: req.params.id, isBooked: true, scheduledAt: { gte: new Date() } },
      select: { scheduledAt: true },
    })
    const bookedTimes = new Set(bookedSlots.map((s) => s.scheduledAt.toISOString()))
    const openSlots = expandedSlots.filter((slot) => !bookedTimes.has(slot.start.toISOString()))
    ok(res, { slots: openSlots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
