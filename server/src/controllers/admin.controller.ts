import { Request, Response } from 'express'
import * as adminService from '../services/admin.service'
import { ok, badRequest } from '../utils/response'
import { sendProfessionalVerificationEmail } from '../services/email.service'

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getStats())
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingProfessionals = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await adminService.getPendingProfessionals())
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
