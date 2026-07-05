import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authMiddleware, cacheMiddleware } from '../middleware'

const router = Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/check-email', authController.checkEmailAvailability)
router.get('/me', authMiddleware, cacheMiddleware(20), authController.getMe)

export default router
