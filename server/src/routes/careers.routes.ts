import { Router } from 'express'
import * as careersController from '../controllers/careers.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.get('/sectors', authMiddleware, cacheMiddleware(120), careersController.getSectors)
router.get(
  '/reachable-from-stream',
  authMiddleware,
  roleGuard('STUDENT'),
  cacheMiddleware(60),
  careersController.getReachable,
)
// Admin: list all careers including inactive, with roadmap steps
router.get('/admin/all', authMiddleware, roleGuard('ADMIN'), careersController.adminListAll)
router.get('/', authMiddleware, cacheMiddleware(120), careersController.list)
router.get('/:id/roadmap', authMiddleware, cacheMiddleware(120), careersController.getRoadmap)
router.get('/:id', authMiddleware, cacheMiddleware(120), careersController.getOne)
router.post('/', authMiddleware, roleGuard('ADMIN'), careersController.create)
router.patch('/:id', authMiddleware, roleGuard('ADMIN'), careersController.update)
router.patch('/:id/toggle', authMiddleware, roleGuard('ADMIN'), careersController.toggle)
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), careersController.remove)
// Roadmap step sub-resource (admin-owned)
router.post('/:id/steps', authMiddleware, roleGuard('ADMIN'), careersController.addStep)
router.patch('/:id/steps/:stepId', authMiddleware, roleGuard('ADMIN'), careersController.updateStep)
router.delete('/:id/steps/:stepId', authMiddleware, roleGuard('ADMIN'), careersController.removeStep)

export default router
