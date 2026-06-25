import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('ADMIN'))

router.get('/stats', adminController.getStats)
router.get('/verification/professionals', adminController.getPendingProfessionals)
router.patch('/verification/professionals/:id/approve', adminController.approveProfessional)
router.patch('/verification/professionals/:id/reject', adminController.rejectProfessional)
router.get('/verification/companies', adminController.getPendingCompanies)
router.patch('/verification/companies/:id/approve', adminController.approveCompany)
router.patch('/verification/companies/:id/reject', adminController.rejectCompany)
router.patch('/professionals/:id/suspend', adminController.suspendProfessional)
router.patch('/professionals/:id/reinstate', adminController.reinstateProfessional)
router.patch('/companies/:id/suspend', adminController.suspendCompany)
router.patch('/companies/:id/reinstate', adminController.reinstateCompany)
router.patch('/professionals/:id/quota', adminController.updateQuota)

export default router
