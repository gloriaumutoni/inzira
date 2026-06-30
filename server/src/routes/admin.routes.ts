import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('ADMIN'))

router.get('/stats', adminController.getStats)
router.get('/verification/professionals', adminController.getPendingProfessionals)
router.patch('/verification/professionals/:id/approve', adminController.approveProfessional)
router.patch('/verification/professionals/:id/reject', adminController.rejectProfessional)
router.patch('/professionals/:id/suspend', adminController.suspendProfessional)
router.patch('/professionals/:id/reinstate', adminController.reinstateProfessional)
router.patch('/professionals/:id/quota', adminController.updateQuota)

export default router
