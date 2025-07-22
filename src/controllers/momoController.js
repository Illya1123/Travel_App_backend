import crypto from 'crypto'
import axios from 'axios'
import dotenv from 'dotenv'
import TourOrder from '../models/tour_order.js'
import Voucher from '../models/voucher.js'

dotenv.config()

// Xử lý thanh toán MoMo
export const createMomoPayment = async (req, res) => {
    try {
        const {
            userId,
            totalPrice,
            originalPrice,
            pickupPhone,
            pickupAddress,
            discountAmount = 0,
            voucherId,
            paymentMethod,
            tour,
            note,
        } = req.body

        const partnerCode = process.env.MOMO_PARTNER_CODE
        const orderId = partnerCode + new Date().getTime()
        const requestId = orderId

        const userAgent = req.headers['user-agent'] || ''
        const isDesktop = userAgent.includes('Windows') || userAgent.includes('Macintosh')

        const redirectUrl = isDesktop
            ? process.env.MOMO_REDIRECT_URL_V2
            : process.env.MOMO_REDIRECT_URL

        // Xử lý voucher (nếu có)
        const appliedVoucher = []
        if (voucherId) {
            const voucher = await Voucher.findById(voucherId)
            if (!voucher || !voucher.isActive || voucher.quantity <= 0) {
                return res
                    .status(400)
                    .json({ message: 'Voucher không hợp lệ hoặc đã hết lượt sử dụng!' })
            }

            if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
                return res.status(400).json({ message: 'Voucher đã hết hạn!' })
            }

            if (totalPrice < (voucher.minOrderValue || 0)) {
                return res.status(400).json({
                    message: `Đơn hàng cần tối thiểu ${voucher.minOrderValue}đ để áp dụng voucher!`,
                })
            }

            // Trừ lượt sử dụng
            voucher.quantity -= 1
            await voucher.save()
            appliedVoucher.push({ voucherId })
        }

        // Tạo đơn hàng
        const newOrder = new TourOrder({
            userId,
            orderId,
            status: 'Chưa hoàn thành giao dịch',
            tour,
            paymentMethod,
            note,
            pickupPhone,
            pickupAddress,
            originalPrice,
            discountAmount,
            totalPrice,
            voucher: appliedVoucher,
        })

        await newOrder.save()

        // Gửi yêu cầu đến MoMo
        const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${totalPrice}&extraData=&ipnUrl=${process.env.MOMO_IPN_URL}&orderId=${orderId}&orderInfo=Thanh toán đặt tour&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`
        const signature = crypto
            .createHmac('sha256', process.env.MOMO_SECRET_KEY)
            .update(rawSignature)
            .digest('hex')

        const response = await axios.post(process.env.MOMO_ENDPOINT, {
            partnerCode,
            requestId,
            orderId,
            orderInfo: 'Thanh toán đặt tour',
            amount: totalPrice.toString(),
            redirectUrl,
            ipnUrl: process.env.MOMO_IPN_URL,
            lang: 'vi',
            requestType: 'captureWallet',
            extraData: '',
            signature,
        })

        return res.status(200).json(response.data)
    } catch (error) {
        console.error('Lỗi thanh toán MoMo:', error)
        return res.status(500).json({ success: false, message: 'Lỗi server' })
    }
}

// Xử lý callback từ MoMo (Khi thanh toán thành công)
export const momoCallback = async (req, res) => {
    try {
        console.log('Callback từ MoMo:', req.body)
        const { orderId, resultCode, message } = req.body

        const order = await TourOrder.findOne({ orderId })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
        }

        if (order.status === 'Đã thanh toán') {
            return res.status(200).json({ success: true, message: 'Đơn hàng đã xử lý trước đó' })
        }

        if (resultCode === 0) {
            order.status = 'Đã thanh toán'
            await order.save()

            // Gửi mail hoặc logic khác tại đây

            return res.status(200).json({ success: true, message: 'Thanh toán thành công' })
        } else {
            return res
                .status(400)
                .json({ success: false, message: message || 'Thanh toán thất bại' })
        }
    } catch (error) {
        console.error('Lỗi callback MoMo:', error)
        return res.status(500).json({ success: false, message: 'Lỗi server' })
    }
}

// Kiểm tra trạng thái giao dịch
export const checkMomoTransaction = async (req, res) => {
    try {
        const { orderId } = req.body

        const partnerCode = process.env.MOMO_PARTNER_CODE
        const accessKey = process.env.MOMO_ACCESS_KEY
        const secretKey = process.env.MOMO_SECRET_KEY
        const requestId = orderId

        const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`
        const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')

        const response = await axios.post(process.env.MOMO_QUERY_URL, {
            partnerCode,
            requestId,
            orderId,
            signature,
            lang: 'vi',
        })

        const { resultCode, message } = response.data

        if (resultCode === 0) {
            await TourOrder.findOneAndUpdate(
                { orderId },
                { status: 'Đã thanh toán' },
                { new: true }
            )

            return res
                .status(200)
                .json({ success: true, message: 'Thanh toán thành công', data: response.data })
        } else {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch chưa hoàn tất hoặc thất bại',
                data: response.data,
            })
        }
    } catch (error) {
        console.error('Lỗi kiểm tra giao dịch:', error)
        return res.status(500).json({ success: false, message: 'Lỗi server' })
    }
}
