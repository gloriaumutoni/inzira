import { Router } from 'express'
import * as paymentsController from '../controllers/payments.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.post('/initiate', authMiddleware, roleGuard('STUDENT'), paymentsController.initiate)
router.get('/status/:reference', authMiddleware, paymentsController.checkStatus)
router.get('/me', authMiddleware, roleGuard('STUDENT'), paymentsController.getMyPayments)
router.get('/professional', authMiddleware, roleGuard('PROFESSIONAL'), paymentsController.getProfessionalEarnings)
router.post('/payout', authMiddleware, roleGuard('PROFESSIONAL'), paymentsController.requestPayout)

export default router
