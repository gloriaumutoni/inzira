import { Router } from 'express'
import * as careersController from '../controllers/careers.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.get('/', authMiddleware, careersController.list)
router.get('/:id', authMiddleware, careersController.getOne)
router.post('/', authMiddleware, roleGuard('ADMIN'), careersController.create)
router.patch('/:id', authMiddleware, roleGuard('ADMIN'), careersController.update)
router.patch('/:id/toggle', authMiddleware, roleGuard('ADMIN'), careersController.toggle)
router.delete('/:id', authMiddleware, roleGuard('ADMIN'), careersController.remove)

export default router
