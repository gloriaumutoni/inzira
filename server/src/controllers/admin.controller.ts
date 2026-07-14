import { Request, Response } from 'express'
import * as adminService from '../services/admin.service'
import { ok, badRequest, conflict } from '../utils/response'
import { prisma } from '../prisma/client'
import { expandWeeklyTemplate } from '../utils/slots'

export const getPublicStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [oLevelStudents, aLevelStudents, professionals, mentors, careerGuides, partnerSchools] =
      await Promise.all([
        prisma.student.count({ where: { level: 'O_LEVEL' } }),
        prisma.student.count({ where: { level: 'A_LEVEL' } }),
        prisma.professional.count({ where: { isVerified: true } }),
        prisma.professional.count({ where: { isMentor: true } }),
        prisma.careerGuide.count({ where: { isVerified: true } }),
        prisma.school.count({ where: { isActive: true } }),
      ])
    ok(res, { oLevelStudents, aLevelStudents, professionals, mentors, careerGuides, partnerSchools })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getStats())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getPendingProfessionals())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.approveProfessional(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.rejectProfessional(req.params.id, req.body.reason))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingCareerGuides = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getPendingCareerGuides())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveCareerGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.approveCareerGuide(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectCareerGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.rejectCareerGuide(req.params.id, req.body.reason))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingMentorApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getPendingMentorApplications())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveMentorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.approveMentorApplication(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectMentorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.rejectMentorApplication(req.params.id, req.body.reason))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const suspendProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.suspendProfessional(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const reinstateProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.reinstateProfessional(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateQuota = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.updateQuota(req.params.id, req.body.quota))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAdminInterviewSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slots = await prisma.adminInterviewSlot.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
      include: {
        bookings: {
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jobTitle: true,
                employer: true,
                mentorBio: true,
                mentorAppliedAt: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    })
    ok(res, { slots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateAdminInterviewSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.adminInterviewSlot.findUnique({
      where: { id },
      include: { bookings: { take: 1 } },
    })
    if (!existing?.isActive) {
      badRequest(res, 'Slot not found.')
      return
    }
    if (existing.bookings.length > 0) {
      badRequest(res, 'Cannot edit a slot that has already been booked.')
      return
    }
    const { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink, endDate } = req.body as {
      dayOfWeek: number
      startHour: number
      startMinute: number
      endHour: number
      endMinute: number
      meetLink: string
      endDate?: string | null
    }
    const updated = await prisma.adminInterviewSlot.update({
      where: { id },
      data: { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink, endDate: endDate ? new Date(endDate) : null },
    })
    ok(res, updated)
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      conflict(res, 'A slot already exists at this day and time.')
      return
    }
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const createAdminInterviewSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink, endDate } = req.body as {
      dayOfWeek: number
      startHour: number
      startMinute: number
      endHour: number
      endMinute: number
      meetLink: string
      endDate?: string | null
    }
    const slot = await prisma.adminInterviewSlot.create({
      data: { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink, endDate: endDate ? new Date(endDate) : null },
    })
    ok(res, slot)
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      conflict(res, 'A slot already exists at this day and time.')
      return
    }
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const deleteAdminInterviewSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.adminInterviewSlot.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })
    ok(res, { deleted: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getReportStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const level = req.query.level === 'A_LEVEL' ? 'A_LEVEL' : 'O_LEVEL'
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1)
    const all = req.query.all === 'true'
    ok(res, await adminService.getReportStudents(level, page, all))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getReportProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.type as string
    let type: 'professional' | 'mentor' | 'rejected' | 'mentor-rejected' = 'professional'
    if (q === 'mentor') type = 'mentor'
    else if (q === 'rejected') type = 'rejected'
    else if (q === 'mentor-rejected') type = 'mentor-rejected'
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1)
    const all = req.query.all === 'true'
    ok(res, await adminService.getReportProfessionals(type, page, all))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getReportCareerGuides = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1)
    const status = req.query.status === 'rejected' ? 'rejected' : 'approved'
    const all = req.query.all === 'true'
    ok(res, await adminService.getReportCareerGuides(page, status, all))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getReportSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getReportSummary())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAvailableInterviewSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const allTemplates = await prisma.adminInterviewSlot.findMany({ where: { isActive: true } })
    const booked = await prisma.mentorApplicationInterviewBooking.findMany({
      select: { adminSlotId: true },
    })
    const bookedTemplateIds = new Set(booked.map((b) => b.adminSlotId))
    const templates = allTemplates.filter((t) => !bookedTemplateIds.has(t.id))
    const expanded = expandWeeklyTemplate(templates)
    const available = expanded
      .map((slot) => {
        const matchingTemplate = templates.find(
          (t) =>
            t.dayOfWeek === slot.start.getDay() &&
            t.startHour === slot.start.getHours() &&
            t.startMinute === slot.start.getMinutes()
        )
        return {
          adminSlotId: matchingTemplate?.id ?? '',
          start: slot.start,
          end: slot.end,
          meetLink: matchingTemplate?.meetLink ?? '',
          endDate: matchingTemplate?.endDate ?? null,
        }
      })
      .filter((slot) => !slot.endDate || slot.start <= slot.endDate)
    ok(res, { slots: available })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
