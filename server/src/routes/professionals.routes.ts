import { Router } from 'express'
import * as professionalsController from '../controllers/professionals.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

// /me routes must come before /:id to prevent Express matching "me" as an id
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getMe)
router.patch('/me', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMe)
router.patch('/me/tiers', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateTiers)
router.get('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getAvailability)
router.post('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.saveAvailability)
router.get('/me/dashboard', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getDashboard)
router.get('/me/quota', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getQuota)

router.get('/', authMiddleware, professionalsController.browse)
router.get('/recommended', authMiddleware, roleGuard('STUDENT'), professionalsController.getRecommendedProfessionals)
router.get('/:id', authMiddleware, professionalsController.getPublicProfile)

export default router
