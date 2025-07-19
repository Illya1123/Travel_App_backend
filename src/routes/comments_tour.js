import express from 'express'
import { getCommentsByTour, createComment, updateComment } from '../controllers/comments_tour'

const router = express.Router()

router.get('/tour/:tourId', getCommentsByTour)
router.post('/', createComment)
router.put('/:commentId', updateComment)

export default router
