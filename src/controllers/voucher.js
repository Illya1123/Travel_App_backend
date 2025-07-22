import asyncHandler from 'express-async-handler'
import Voucher from '../models/voucher.js'

export const createVoucher = asyncHandler(async (req, res) => {
    const { code, quantity, type, discountValue, maxDiscount, minOrderValue, expiryDate } = req.body

    const exist = await Voucher.findOne({ code })
    if (exist) {
        res.status(400)
        throw new Error('Mã voucher đã tồn tại')
    }

    const voucher = await Voucher.create({
        code,
        quantity,
        type,
        discountValue,
        maxDiscount,
        minOrderValue,
        expiryDate,
    })

    res.status(201).json(voucher)
})

export const getAllVouchers = asyncHandler(async (req, res) => {
    const vouchers = await Voucher.find().sort({ createdAt: -1 })
    res.json(vouchers)
})

export const getVoucherByCode = asyncHandler(async (req, res) => {
    const { code } = req.params
    const voucher = await Voucher.findOne({ code })

    if (!voucher) {
        res.status(404)
        throw new Error('Không tìm thấy voucher')
    }

    res.json(voucher)
})

export const applyVoucher = async (req, res) => {
    try {
        const { code, totalPrice } = req.body

        if (!code || totalPrice == null) {
            return res.status(400).json({ message: 'Thiếu mã giảm giá hoặc tổng đơn hàng!' })
        }

        const voucher = await Voucher.findOne({ code: code.trim().toUpperCase() })
        if (!voucher) return res.status(404).json({ message: 'Mã giảm giá không tồn tại!' })

        // Kiểm tra còn hiệu lực
        const now = new Date()
        if (
            !voucher.isActive ||
            voucher.quantity <= 0 ||
            (voucher.expiryDate && now > new Date(voucher.expiryDate)) ||
            (voucher.minOrderValue && totalPrice < voucher.minOrderValue)
        ) {
            return res.status(400).json({ message: 'Mã giảm giá không còn hiệu lực!' })
        }

        let discountAmount = 0
        if (voucher.type === 'percentage') {
            discountAmount = Math.round((voucher.discountValue / 100) * totalPrice)
            if (voucher.maxDiscount) {
                discountAmount = Math.min(discountAmount, voucher.maxDiscount)
            }
        } else if (voucher.type === 'fixed') {
            discountAmount = voucher.discountValue
        }

        discountAmount = Math.min(discountAmount, totalPrice) // không vượt quá đơn hàng

        return res.json({
            voucherId: voucher._id,
            discountAmount,
        })
    } catch (error) {
        console.error('Lỗi áp dụng mã giảm giá:', error)
        return res.status(500).json({ message: 'Lỗi server khi áp dụng mã giảm giá!' })
    }
}

export const deleteVoucher = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findById(req.params.id)

    if (!voucher) {
        res.status(404)
        throw new Error('Không tìm thấy voucher')
    }

    await voucher.remove()
    res.json({ message: 'Xoá voucher thành công' })
})

export const updateVoucher = asyncHandler(async (req, res) => {
    const voucher = await Voucher.findById(req.params.id)

    if (!voucher) {
        res.status(404)
        throw new Error('Không tìm thấy voucher')
    }

    Object.assign(voucher, req.body)
    const updated = await voucher.save()
    res.json(updated)
})
