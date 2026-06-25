import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authMiddleware } from '../middleware'

const router = Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authMiddleware, authController.getMe)

export default router
