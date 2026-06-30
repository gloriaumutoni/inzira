import { Request, Response } from 'express'
import * as professionalsService from '../services/professionals.service'
import { ok, badRequest } from '../utils/response'
import { prisma } from '../prisma/client'
import { sendAdminNewMentorApplicationAlert } from '../services/email.service'

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
      include: { user: { select: { email: true } } },
    })

    if (!professional?.isVerified) {
      res.status(403).json({ success: false, error: 'Only verified professionals can apply to be mentors.' })
      return
    }

    if (professional.mentorApplicationStatus === 'PENDING') {
      res.status(409).json({ success: false, error: 'You already have a pending mentor application.' })
      return
    }

    const { mentorBio } = req.body

    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        mentorApplicationStatus: 'PENDING',
        mentorAppliedAt: new Date(),
        mentorBio: mentorBio ?? null,
      },
    })

    try {
      await sendAdminNewMentorApplicationAlert({
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.user.email,
        linkedinUrl: professional.linkedinUrl,
      })
    } catch (err) {
      console.error('Failed to send mentor application alert:', err)
    }

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
