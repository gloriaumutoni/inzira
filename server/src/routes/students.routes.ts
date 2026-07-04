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
router.get('/me/group-sessions', studentsController.getGroupSessions)
router.get('/me/mentor-slots', studentsController.getBookedMentorSlots)

export default router
