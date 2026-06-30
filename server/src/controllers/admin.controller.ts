import { Request, Response } from 'express'
import * as adminService from '../services/admin.service'
import { ok, badRequest } from '../utils/response'
import { sendVerificationResultAlert } from '../services/email.service'
import { prisma } from '../prisma/client'
import { expandWeeklyTemplate } from '../utils/slots'

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getStats())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    const professionals = await adminService.getPendingProfessionals()
    ok(res, { professionals })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.approveProfessional(req.params.id)
    await sendVerificationResultAlert({
      roleLabel: 'Professional',
      email: result.user.email,
      firstName: result.firstName,
      approved: true,
    })
    ok(res, result)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.rejectProfessional(req.params.id, req.body.reason)
    await sendVerificationResultAlert({
      roleLabel: 'Professional',
      email: result.professional.user.email,
      firstName: result.professional.firstName,
      approved: false,
    })
    ok(res, { rejected: result.rejected, id: result.id })
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

export const getPendingMentorApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const applications = await prisma.professional.findMany({
      where: { mentorApplicationStatus: { in: ['PENDING', 'INTERVIEWED'] } },
      include: {
        user: { select: { email: true } },
        interviewBooking: { include: { adminSlot: true } },
      },
      orderBy: { mentorAppliedAt: 'desc' },
    })

    ok(res, {
      applications: applications.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.user.email,
        jobTitle: p.jobTitle,
        employer: p.employer,
        sector: p.sector,
        linkedinUrl: p.linkedinUrl,
        mentorBio: p.mentorBio,
        mentorApplicationStatus: p.mentorApplicationStatus,
        appliedAt: p.mentorAppliedAt,
        interview: p.interviewBooking
          ? {
              scheduledAt: p.interviewBooking.scheduledAt,
              meetLink: p.interviewBooking.meetLink,
              adminSlotId: p.interviewBooking.adminSlotId,
            }
          : null,
      })),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const markMentorInterviewed = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.professional.update({
      where: { id: req.params.id },
      data: { mentorApplicationStatus: 'INTERVIEWED' },
    })
    ok(res, { marked: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveMentorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: { isMentor: true, mentorApplicationStatus: 'APPROVED' },
      include: { user: { select: { email: true } } },
    })

    await sendVerificationResultAlert({
      roleLabel: 'Mentor Application',
      email: professional.user.email,
      firstName: professional.firstName,
      approved: true,
    })

    ok(res, professional)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectMentorApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.update({
      where: { id: req.params.id },
      data: { isMentor: false, mentorApplicationStatus: 'REJECTED' },
      include: { user: { select: { email: true } } },
    })

    await prisma.mentorApplicationInterviewBooking.deleteMany({
      where: { professionalId: req.params.id },
    })

    await sendVerificationResultAlert({
      roleLabel: 'Mentor Application',
      email: professional.user.email,
      firstName: professional.firstName,
      approved: false,
    })

    ok(res, professional)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingCareerGuides = async (req: Request, res: Response): Promise<void> => {
  try {
    const careerGuides = await prisma.careerGuide.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { email: true } },
        school: { select: { name: true, district: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    ok(res, {
      careerGuides: careerGuides.map((cg) => ({
        id: cg.id,
        firstName: cg.firstName,
        lastName: cg.lastName,
        email: cg.user.email,
        school: cg.school ? `${cg.school.name} — ${cg.school.district}` : 'Not selected',
        linkedinUrl: cg.linkedinUrl,
        submittedAt: cg.createdAt,
      })),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const approveCareerGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    const careerGuide = await prisma.careerGuide.update({
      where: { id: req.params.id },
      data: { isVerified: true, verificationStatus: 'APPROVED' },
      include: { user: { select: { email: true } } },
    })

    await sendVerificationResultAlert({
      roleLabel: 'Career Guide',
      email: careerGuide.user.email,
      firstName: careerGuide.firstName,
      approved: true,
    })

    ok(res, careerGuide)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectCareerGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    const careerGuide = await prisma.careerGuide.update({
      where: { id: req.params.id },
      data: { isVerified: false, verificationStatus: 'REJECTED' },
      include: { user: { select: { email: true } } },
    })

    await sendVerificationResultAlert({
      roleLabel: 'Career Guide',
      email: careerGuide.user.email,
      firstName: careerGuide.firstName,
      approved: false,
    })

    ok(res, careerGuide)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAdminInterviewSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slots = await prisma.adminInterviewSlot.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    })
    ok(res, { slots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const createAdminInterviewSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink } = req.body
    const slot = await prisma.adminInterviewSlot.create({
      data: { dayOfWeek, startHour, startMinute, endHour, endMinute, meetLink },
    })
    ok(res, slot)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const deleteAdminInterviewSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.adminInterviewSlot.update({ where: { id: req.params.id }, data: { isActive: false } })
    ok(res, { deleted: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getAvailableInterviewSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.adminInterviewSlot.findMany({ where: { isActive: true } })
    const expanded = expandWeeklyTemplate(templates)
    const booked = await prisma.mentorApplicationInterviewBooking.findMany({
      select: { scheduledAt: true },
    })
    const bookedTimes = new Set(booked.map((b) => b.scheduledAt.toISOString()))
    const available = expanded
      .filter((slot) => !bookedTimes.has(slot.start.toISOString()))
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
        }
      })
    ok(res, { slots: available })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
