import { Request, Response } from 'express'
import * as schoolsService from '../services/schools.service'
import { ok, created, badRequest } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await schoolsService.list())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await schoolsService.create(req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await schoolsService.getOne(req.params.id))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await schoolsService.update(req.params.id, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const assignCareerGuide = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await schoolsService.assignCareerGuide(req.params.id, req.body.email))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
