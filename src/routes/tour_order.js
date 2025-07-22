import express from 'express'
import {
    createTourOrder,
    getAllTourOrders,
    getTourOrdersByUserId,
    updateTourOrderStatus,
    deleteTourOrder,
    getOrderByOrderId,
} from '../controllers/tour_oder.js'

import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

router.post('/', createTourOrder)
router.get('/', [verifyAccessToken, isAdmin], getAllTourOrders)
router.get('/user/:userId', getTourOrdersByUserId)
router.put('/:id/status', updateTourOrderStatus)
router.delete('/:id', deleteTourOrder)
router.get('/order/:orderId', getOrderByOrderId)

export default router
