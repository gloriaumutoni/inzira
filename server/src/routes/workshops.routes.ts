import { Router } from 'express'
import * as workshopsController from '../controllers/workshops.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

// /me must come before /:id
router.get('/me', authMiddleware, roleGuard('COMPANY'), workshopsController.getOwn)

router.get('/', authMiddleware, workshopsController.list)
router.get('/:id', authMiddleware, workshopsController.getOne)
router.post('/', authMiddleware, roleGuard('COMPANY'), workshopsController.create)
router.patch('/:id', authMiddleware, roleGuard('COMPANY'), workshopsController.update)
router.patch('/:id/publish', authMiddleware, roleGuard('COMPANY'), workshopsController.publish)
router.delete('/:id', authMiddleware, roleGuard('COMPANY', 'ADMIN'), workshopsController.cancelWorkshop)
router.post('/:id/register', authMiddleware, roleGuard('STUDENT'), workshopsController.register)
router.delete('/:id/register', authMiddleware, roleGuard('STUDENT'), workshopsController.unregister)
router.get('/:id/registrations', authMiddleware, roleGuard('COMPANY', 'CAREER_GUIDE', 'ADMIN'), workshopsController.getRegistrations)

export default router
