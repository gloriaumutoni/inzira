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
