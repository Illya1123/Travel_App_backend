import express from 'express'
import {
    createVoucher,
    getAllVouchers,
    getVoucherByCode,
    applyVoucher,
    deleteVoucher,
    updateVoucher,
} from '../controllers/voucher'

const router = express.Router()

router.post('/', createVoucher)
router.get('/', getAllVouchers)
router.get('/:code', getVoucherByCode)
router.post('/apply', applyVoucher)
router.delete('/:id', deleteVoucher)
router.put('/:id', updateVoucher)

export default router
