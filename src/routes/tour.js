import express from 'express'
import { getTours, createTour, deleteTour } from '../controllers/tour.js'

import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

// GET: Lấy danh sách tất cả các tour
router.get('/getAllTours', getTours);

// Admin routes (require admin permission)
// POST: Thêm mới một tour
router.post('/createTours', [verifyAccessToken, isAdmin], createTour);
// DELETE: Xóa tour theo ID
router.delete('/deleteTours/:id', [verifyAccessToken, isAdmin], deleteTour);

export default router