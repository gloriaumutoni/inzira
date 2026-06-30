import { Request, Response } from 'express'
import * as groupSessionsService from '../services/groupSessions.service'
import { ok, created, badRequest, conflict } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector, page, limit } = req.query
    ok(res, await groupSessionsService.list({
      sector: sector as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOwn = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await groupSessionsService.getOwn(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await groupSessionsService.getOne(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await groupSessionsService.create(req.auth!.userId, req.body))
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      conflict(res, 'A group session already exists at this date and time.')
      return
    }
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await groupSessionsService.update(req.params.id, req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = (req.query.scope as 'this' | 'all') ?? 'this'
    ok(res, await groupSessionsService.cancel(req.params.id, req.auth!.userId, scope))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const enrol = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await groupSessionsService.enrol(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const leave = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await groupSessionsService.leave(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getRoster = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await groupSessionsService.getRoster(
      req.params.id, req.auth!.userId, req.auth!.role
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
