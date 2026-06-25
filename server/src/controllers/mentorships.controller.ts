import { Request, Response } from 'express'
import * as mentorshipsService from '../services/mentorships.service'
import { ok, created, badRequest } from '../utils/response'

export const getMine = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await mentorshipsService.getMine(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const start = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await mentorshipsService.start(req.auth!.userId, req.body.professionalId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await mentorshipsService.cancel(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const switchProfessional = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await mentorshipsService.switchProfessional(
      req.auth!.userId, req.body.professionalId
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await mentorshipsService.getStudents(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await mentorshipsService.getBilling(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
