import { Router } from 'express'
import * as studentsController from '../controllers/students.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('STUDENT'))

router.get('/me', studentsController.getMe)
router.patch('/me', studentsController.updateMe)
router.get('/me/dashboard', studentsController.getDashboard)
router.post('/me/confidence', studentsController.logConfidence)
router.get('/me/confidence', studentsController.getConfidenceLogs)

export default router
