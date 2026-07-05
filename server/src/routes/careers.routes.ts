import { Router } from 'express'
import * as careersController from '../controllers/careers.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.get('/sectors', authMiddleware, cacheMiddleware(120), careersController.getSectors)
router.get('/', authMiddleware, cacheMiddleware(120), careersController.list)
router.get('/:id', authMiddleware, cacheMiddleware(120), careersController.getOne)
router.post('/', authMiddleware, roleGuard('ADMIN'), careersController.create)
router.patch('/:id', authMiddleware, roleGuard('ADMIN'), careersController.update)
router.patch('/:id/toggle', authMiddleware, roleGuard('ADMIN'), careersController.toggle)
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), careersController.remove)

export default router
