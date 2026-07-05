import { Router } from 'express'
import * as mentorshipsController from '../controllers/mentorships.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.get('/me', authMiddleware, roleGuard('STUDENT'), cacheMiddleware(20), mentorshipsController.getMine)
router.post('/', authMiddleware, roleGuard('STUDENT'), mentorshipsController.start)
router.delete('/me', authMiddleware, roleGuard('STUDENT'), mentorshipsController.cancel)
router.patch('/me/professional', authMiddleware, roleGuard('STUDENT'), mentorshipsController.switchProfessional)
router.get('/students', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(20), mentorshipsController.getStudents)
router.get('/billing', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(30), mentorshipsController.getBilling)

export default router
