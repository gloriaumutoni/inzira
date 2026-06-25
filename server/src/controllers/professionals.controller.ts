import { Request, Response } from 'express'
import * as professionalsService from '../services/professionals.service'
import { ok, badRequest } from '../utils/response'

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
