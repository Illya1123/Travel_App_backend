import express from 'express'
import { getDashboardStats } from '../controllers/Dashboard.js'
import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

router.get('/stats', [verifyAccessToken, isAdmin], getDashboardStats)

export default router
