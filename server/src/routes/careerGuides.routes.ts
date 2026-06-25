import { Router } from 'express'
import * as careerGuidesController from '../controllers/careerGuides.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('CAREER_GUIDE'))

router.get('/me', careerGuidesController.getMe)
router.get('/me/dashboard', careerGuidesController.getDashboard)

export default router
