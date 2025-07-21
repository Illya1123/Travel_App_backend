import express from 'express'
import {
    getPaymentMethods,
    seedPaymentMethods,
    updatePaymentMethodStatus,
} from '../controllers/paymentMethodController.js'

import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

// Lấy tất cả phương thức thanh toán
router.get('/', getPaymentMethods)

// Khởi tạo phương thức thanh toán mặc định
router.post('/seed', [verifyAccessToken, isAdmin], seedPaymentMethods)

// Cập nhật trạng thái theo name
router.put('/:name', [verifyAccessToken, isAdmin], updatePaymentMethodStatus)

export default router
