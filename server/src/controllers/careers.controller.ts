import { Request, Response } from 'express'
import * as careersService from '../services/careers.service'
import { ok, created, badRequest } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector, combination, page, limit, includeUnmatched } = req.query
    const isAdmin = (req as { auth?: { role?: string } }).auth?.role === 'ADMIN'
    ok(res, await careersService.list({
      sector: sector as string,
      combination: combination as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      includeUnmatched: isAdmin && includeUnmatched === 'true',
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.getOne(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await careersService.create(req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.update(req.params.id, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const toggle = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.toggle(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.remove(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getRoadmap = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.getRoadmap(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getReachable = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.getReachableFromStream(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getSectors = async (_req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.getSectors())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminListAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.adminListAll())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const addStep = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await careersService.addStep(req.params.id, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateStep = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.updateStep(req.params.id, req.params.stepId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const removeStep = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careersService.removeStep(req.params.id, req.params.stepId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
