import { Router } from 'express'
import * as careerStoriesController from '../controllers/careerStories.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.get('/combinations', cacheMiddleware(120), careerStoriesController.getCombinations)
router.get('/', cacheMiddleware(60), careerStoriesController.list)
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(20), careerStoriesController.getMyStories)
router.get('/:id', cacheMiddleware(60), careerStoriesController.getOne)
router.post('/', authMiddleware, roleGuard('PROFESSIONAL'), careerStoriesController.create)
router.patch('/:id', authMiddleware, roleGuard('PROFESSIONAL'), careerStoriesController.update)

export default router
