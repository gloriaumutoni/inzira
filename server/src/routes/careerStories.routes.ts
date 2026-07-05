import { Router } from 'express'
import * as careerStoriesController from '../controllers/careerStories.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.get('/combinations', careerStoriesController.getCombinations)
router.get('/', careerStoriesController.list)
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), careerStoriesController.getMyStories)
router.get('/:id', careerStoriesController.getOne)
router.post('/', authMiddleware, roleGuard('PROFESSIONAL'), careerStoriesController.create)
router.patch('/:id', authMiddleware, roleGuard('PROFESSIONAL'), careerStoriesController.update)

export default router
