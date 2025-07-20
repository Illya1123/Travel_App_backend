import cron from 'node-cron'
import axios from 'axios'
import TourOrder from '../models/tour_order.js'

// Hàm xóa đơn hàng quá 15 phút
export const deleteExpiredOrders = async () => {
    try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        const result = await TourOrder.deleteMany({
            status: 'Chưa hoàn thành giao dịch',
            createdAt: { $lt: fifteenMinutesAgo },
        })

        if (result.deletedCount > 0) {
            clearTerminal()
            console.log(`🗑 Đã xóa ${result.deletedCount} đơn hàng quá hạn.`)
        }
    } catch (error) {
        console.error('❌ Lỗi khi xóa đơn hàng:', error)
    }
}

// Hàm kiểm tra trạng thái thanh toán của đơn hàng
export const checkAllOrders = async () => {
    try {
        const orders = await TourOrder.find({ status: 'Chưa hoàn thành giao dịch' })

        if (orders.length === 0) {
            return // Không log nếu không có đơn nào đang chờ xử lý
        }

        clearTerminal()
        console.log(`🔎 Đang kiểm tra ${orders.length} đơn hàng...`)

        for (const order of orders) {
            const { _id, orderId } = order

            try {
                const response = await axios.post(
                    'http://localhost:3000/api/payment-momo/momo/status',
                    { orderId },
                    { headers: { 'Content-Type': 'application/json' } }
                )

                const result = response.data

                if (result.success && result.data.resultCode === 0) {
                    await TourOrder.findByIdAndUpdate(_id, { status: 'Đã thanh toán' })
                    console.log(`✅ Đơn hàng ${orderId} đã thanh toán.`)
                } else {
                    console.log(`❌ Đơn hàng ${orderId} chưa thanh toán.`)
                }
            } catch (error) {
                console.error(`🚨 Lỗi kiểm tra đơn hàng ${orderId}:`, error.message)
            }
        }
    } catch (error) {
        console.error('🚨 Lỗi lấy danh sách đơn hàng:', error.message)
    }
}

// Clear toàn bộ terminal (giống lệnh `clear`)
const clearTerminal = () => {
    process.stdout.write('\x1B[2J\x1B[0f') // clear screen & move cursor to top-left
}

// Chạy cron job mỗi 30 giây để kiểm tra đơn hàng
export const startOrderCheckCron = () => {
    console.log('⏰ Bắt đầu kiểm tra trạng thái đơn hàng mỗi 30 giây...')
    cron.schedule('*/30 * * * * *', () => {
        checkAllOrders()
    })
}

// Chạy xóa đơn hàng hết hạn mỗi phút
export const startDeleteExpiredOrdersInterval = () => {
    console.log('🧹 Bắt đầu kiểm tra đơn hàng hết hạn mỗi phút...')
    setInterval(deleteExpiredOrders, 60 * 1000)
}
