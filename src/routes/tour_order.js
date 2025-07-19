import express from 'express'
import {
    createTourOrder,
    getAllTourOrders,
    getTourOrdersByUserId,
    updateTourOrderStatus,
    deleteTourOrder,
} from '../controllers/tour_oder.js'

const router = express.Router()

router.post('/', createTourOrder)
router.get('/', getAllTourOrders)
router.get('/user/:userId', getTourOrdersByUserId)
router.put('/:id/status', updateTourOrderStatus)
router.delete('/:id', deleteTourOrder)

export default router
