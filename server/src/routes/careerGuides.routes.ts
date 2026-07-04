import { Router } from 'express'
import * as careerGuidesController from '../controllers/careerGuides.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('CAREER_GUIDE'))

router.get('/me', careerGuidesController.getMe)
router.get('/me/dashboard', careerGuidesController.getDashboard)
router.get('/me/students', careerGuidesController.getMySchoolStudents)
router.post('/me/reapply', careerGuidesController.reapplyVerification)

export default router
