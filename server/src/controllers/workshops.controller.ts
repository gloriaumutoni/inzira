import { Request, Response } from 'express'
import * as workshopsService from '../services/workshops.service'
import { ok, created, badRequest } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector, format, upcomingOnly, page, limit } = req.query
    ok(res, await workshopsService.list({
      sector: sector as string,
      format: format as string,
      upcomingOnly: upcomingOnly === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOwn = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.getOwn(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.getOne(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await workshopsService.create(req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.update(req.params.id, req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const publish = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.publish(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const cancelWorkshop = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.cancelWorkshop(
      req.params.id, req.auth!.userId, req.auth!.role
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await workshopsService.register(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const unregister = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.unregister(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await workshopsService.getRegistrations(
      req.params.id, req.auth!.userId, req.auth!.role
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
