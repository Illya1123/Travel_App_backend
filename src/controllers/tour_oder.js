import TourOrder from '../models/tour_order.js'
import User from '../models/user.js'
import Tour from '../models/tour.js'
import Voucher from '../models/voucher.js'
import mongoose from 'mongoose'

// Tạo đơn đặt tour
export const createTourOrder = async (req, res) => {
    try {
        const {
            userId,
            tour,
            paymentMethod,
            note,
            totalPrice,
            originalPrice,
            pickupPhone,
            pickupAddress,
            discountAmount,
            voucherId,
        } = req.body

        // 1. Kiểm tra user
        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại!' })

        // 2. Kiểm tra các tour
        for (const item of tour) {
            const tourExists = await Tour.findById(item.tourId)
            if (!tourExists) return res.status(404).json({ message: 'Tour không tồn tại!' })
        }

        // 3. Xử lý voucher (nếu có)
        let finalPrice = totalPrice
        let discount = 0
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

            // Tính giảm giá
            if (voucher.type === 'fixed') {
                discount = voucher.discountValue
            } else if (voucher.type === 'percentage') {
                discount = (voucher.discountValue / 100) * totalPrice
                if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                    discount = voucher.maxDiscount
                }
            }

            finalPrice = totalPrice - discount
            appliedVoucher.push({ voucherId })

            // Trừ lượt sử dụng
            voucher.quantity -= 1
            await voucher.save()
        }

        // 4. Tạo đơn hàng
        const newOrder = new TourOrder({
            userId,
            status: 'Đã đặt',
            tour,
            paymentMethod,
            note,
            originalPrice,
            pickupPhone,
            pickupAddress,
            discountAmount: discountAmount || 0,
            totalPrice,
            voucher: voucherId ? [{ voucherId }] : [],
        })

        await newOrder.save()
        res.status(201).json(newOrder)
    } catch (error) {
        console.error('❌ Lỗi:', error)
        res.status(500).json({ message: 'Lỗi khi tạo đơn đặt tour!', error: error.message })
    }
}

// Lấy danh sách tất cả đơn đặt tour
export const getAllTourOrders = async (req, res) => {
    try {
        const orders = await TourOrder.find()
            .populate('userId', 'name email')
            .populate('tour.tourId', 'title price')
            .populate('voucher.voucherId', 'code discountValue type') // Thêm dòng này

        // Format lại kết quả để gắn thêm voucherCode nếu có
        const formattedOrders = orders.map((order) => {
            const voucherCode =
                order.voucher?.[0]?.voucherId?.code || null

            return {
                ...order.toObject(),
                voucherCode,
            }
        })

        res.status(200).json(formattedOrders)
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách đơn đặt tour!',
            error: error.message,
        })
    }
}

// Lấy chi tiết đơn đặt tour theo ID
export const getTourOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'UserId không hợp lệ!' })
        }

        const userObjectId = new mongoose.Types.ObjectId(userId)

        // Lấy tất cả đơn hàng và populate tourId nhưng KHÔNG lấy field `date` của Tour gốc
        const orders = await TourOrder.find({ userId: userObjectId })
            .populate('userId', 'name email')
            .populate({
                path: 'tour.tourId',
                select: 'title price services overview country image', // ❌ Không lấy `date`
            })
            .populate({
                path: 'voucher.voucherId',
                select: 'code discountValue type', // ✅ Lấy thêm code
            })
            .lean()

        if (!orders.length) {
            return res
                .status(404)
                .json({ message: 'Không có đơn đặt tour nào cho người dùng này!' })
        }

        // Lấy thông tin người dùng từ đơn đầu tiên
        const userInfo = {
            name: orders[0].userId.name,
            email: orders[0].userId.email,
        }

        // Xử lý kết quả để giữ lại `date` từ `TourOrder` và gắn mã `code` từ `voucher`
        const formattedOrders = orders.map(({ userId, voucher = [], ...order }) => {
            // Thêm trường voucherCode (nếu có)
            const voucherCode =
                voucher.length > 0 && voucher[0].voucherId ? voucher[0].voucherId.code : null

            return {
                ...order,
                tour: order.tour.map((item) => ({
                    ...item,
                    tourId: {
                        ...item.tourId,
                        // ✅ Giữ lại ngày đặt tour từ order, không bị ghi đè
                        date: item.date,
                    },
                })),
                voucherCode,
            }
        })

        res.status(200).json({
            user: userInfo,
            orders: formattedOrders,
        })
    } catch (error) {
        console.error('❌ Lỗi server:', error)
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách đơn đặt tour!',
            error: error.message,
        })
    }
}

// Cập nhật trạng thái đơn đặt tour
export const updateTourOrderStatus = async (req, res) => {
    try {
        const { status } = req.body
        const validStatuses = ['Đã đặt', 'Đã thanh toán', 'Đã hủy']

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ!' })
        }

        const updatedOrder = await TourOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )

        if (!updatedOrder) return res.status(404).json({ message: 'Đơn đặt tour không tồn tại!' })

        res.status(200).json(updatedOrder)
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi khi cập nhật trạng thái đơn đặt tour!',
            error: error.message,
        })
    }
}

// Xóa đơn đặt tour
export const deleteTourOrder = async (req, res) => {
    try {
        const deletedOrder = await TourOrder.findByIdAndDelete(req.params.id)

        if (!deletedOrder) return res.status(404).json({ message: 'Đơn đặt tour không tồn tại!' })

        res.status(200).json({ message: 'Xóa đơn đặt tour thành công!' })
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa đơn đặt tour!', error: error.message })
    }
}

export const getOrderByOrderId = async (req, res) => {
    const { orderId } = req.params

    try {
        const order = await TourOrder.findOne({ orderId }).populate('tour.tourId')

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' })
        }

        // Chuyển đổi sang object để có thể tùy chỉnh
        const orderObj = order.toObject()

        // Ghi đè date của tour từ TourOrder
        orderObj.tour = orderObj.tour.map((tourItem) => ({
            ...tourItem,
            tourId: {
                ...tourItem.tourId,
                date: tourItem.date,
            },
        }))

        return res.status(200).json({ success: true, order: orderObj })
    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error)
        return res.status(500).json({ message: 'Lỗi server' })
    }
}
