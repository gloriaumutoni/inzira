import { Router } from 'express'
import * as schoolsController from '../controllers/schools.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.get('/', authMiddleware, roleGuard('ADMIN'), schoolsController.list)
router.post('/', authMiddleware, roleGuard('ADMIN'), schoolsController.create)
router.get('/:id', authMiddleware, roleGuard('ADMIN', 'CAREER_GUIDE'), schoolsController.getOne)
router.patch('/:id', authMiddleware, roleGuard('ADMIN'), schoolsController.update)
router.post('/:id/career-guide', authMiddleware, roleGuard('ADMIN'), schoolsController.assignCareerGuide)

export default router
