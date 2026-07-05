import { Request, Response } from 'express'
import * as careerStoriesService from '../services/careerStories.service'
import { ok, created, badRequest } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { combination, sector, search, interests, page, limit } = req.query
    ok(res, await careerStoriesService.list({
      combination: combination as string,
      sector: sector as string,
      search: search as string,
      interests: interests as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerStoriesService.getOne(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMyStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await getProfessionalOrFail(req, res)
    if (!professional) return
    ok(res, await careerStoriesService.getMyStories(professional.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await getProfessionalOrFail(req, res)
    if (!professional) return
    created(res, await careerStoriesService.create(professional.id, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await getProfessionalOrFail(req, res)
    if (!professional) return
    ok(res, await careerStoriesService.update(req.params.id, professional.id, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminApprove = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerStoriesService.approve(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminReject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rejectionReason } = req.body
    ok(res, await careerStoriesService.reject(req.params.id, rejectionReason))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminListPending = async (_req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerStoriesService.listPending())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminList = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'PENDING_REVIEW'
    const allowed = ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED']
    if (!allowed.includes(status)) {
      badRequest(res, 'Invalid status')
      return
    }
    ok(res, await careerStoriesService.listByStatus(status as Parameters<typeof careerStoriesService.listByStatus>[0]))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminUnpublish = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerStoriesService.unpublish(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminCreate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId, ...data } = req.body
    if (!professionalId) {
      badRequest(res, 'professionalId is required')
      return
    }
    created(res, await careerStoriesService.adminCreate(professionalId, data))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminListVerifiedProfessionals = async (_req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerStoriesService.listVerifiedProfessionals())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getCombinations = (_req: Request, res: Response): void => {
  ok(res, careerStoriesService.RWANDA_COMBINATIONS)
}

async function getProfessionalOrFail(req: Request, res: Response) {
  const { prisma } = await import('../prisma/client')
  const professional = await prisma.professional.findUnique({
    where: { userId: req.auth!.userId },
  })
  if (!professional) {
    res.status(404).json({ success: false, error: 'Professional profile not found' })
    return null
  }
  return professional
}
