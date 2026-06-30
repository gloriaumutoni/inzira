import { Request, Response } from 'express'
import * as adminService from '../services/admin.service'
import { ok, badRequest } from '../utils/response'
import { sendProfessionalVerificationEmail, sendMentorApplicationResult } from '../services/email.service'
import { prisma } from '../prisma/client'

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
    try {
      await sendProfessionalVerificationEmail(result.user.email, {
        firstName: result.firstName,
        approved: true,
      })
    } catch {}
    ok(res, result)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const rejectProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.rejectProfessional(req.params.id, req.body.reason)
    try {
      await sendProfessionalVerificationEmail(result.professional.user.email, {
        firstName: result.professional.firstName,
        approved: false,
      })
    } catch {}
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
      where: { mentorApplicationStatus: 'PENDING' },
      include: { user: { select: { email: true } } },
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
        appliedAt: p.mentorAppliedAt,
      })),
    })
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

    try {
      await sendMentorApplicationResult(professional.user.email, professional.firstName, true)
    } catch (err) {
      console.error('Failed to send mentor approval email:', err)
    }

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

    try {
      await sendMentorApplicationResult(professional.user.email, professional.firstName, false)
    } catch (err) {
      console.error('Failed to send mentor rejection email:', err)
    }

    ok(res, professional)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
