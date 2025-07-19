import express from 'express'
import {
    getPaymentMethods,
    seedPaymentMethods,
    updatePaymentMethodStatus,
} from '../controllers/paymentMethodController.js'

const router = express.Router()

// Lấy tất cả phương thức thanh toán
router.get('/', getPaymentMethods)

// Khởi tạo phương thức thanh toán mặc định
router.post('/seed', seedPaymentMethods)

// Cập nhật trạng thái theo name
router.put('/:name', updatePaymentMethodStatus)

export default router
