import express from 'express'
import {
    createVoucher,
    getAllVouchers,
    getVoucherByCode,
    applyVoucher,
    deleteVoucher,
    updateVoucher,
} from '../controllers/voucher'
import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

router.post('/', [verifyAccessToken, isAdmin], createVoucher)
router.get('/', [verifyAccessToken, isAdmin], getAllVouchers)
router.get('/:code', getVoucherByCode)
router.post('/apply', applyVoucher)
router.delete('/:id', [verifyAccessToken, isAdmin], deleteVoucher)
router.put('/:id', [verifyAccessToken, isAdmin], updateVoucher)

export default router
