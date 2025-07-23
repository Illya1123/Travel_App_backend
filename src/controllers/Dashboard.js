import User from '../models/user.js'
import Tour from '../models/tour.js'
import TourOrder from '../models/tour_order.js'

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments()
        const totalTours = await Tour.countDocuments()

        const currentDate = new Date()
        const year = parseInt(req.query.year) || currentDate.getFullYear()
        const month = parseInt(req.query.month) || currentDate.getMonth() + 1
        const day = parseInt(req.query.day) || currentDate.getDate()

        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59)

        // Khoảng thời gian hôm nay
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const endOfToday = new Date()
        endOfToday.setHours(23, 59, 59, 999)

        // Khoảng thời gian ngày được chọn
        const selectedStart = new Date(year, month - 1, day, 0, 0, 0)
        const selectedEnd = new Date(year, month - 1, day, 23, 59, 59)

        // Doanh thu hôm nay
        const revenueToday = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfToday, $lte: endOfToday },
                    status: 'Đã thanh toán',
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ])
        const todayRevenue = revenueToday[0]?.totalRevenue || 0

        // Doanh thu ngày được chọn
        const revenueSelectedDay = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: selectedStart, $lte: selectedEnd },
                    status: 'Đã thanh toán',
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ])
        const selectedDayRevenue = revenueSelectedDay[0]?.totalRevenue || 0

        // Tổng tour đã đặt trong tháng
        const bookedToursInMonth = await TourOrder.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: ['Đã đặt', 'Đã thanh toán'] },
        })
        const totalBookedTours = bookedToursInMonth[0]?.total || 0

        // Tổng tour bị huỷ trong tháng
        const canceledToursInMonth = await TourOrder.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'Đã hủy',
        })
        const totalCanceledTours = canceledToursInMonth[0]?.total || 0

        // Doanh thu trong tháng
        const revenueInMonth = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'Đã thanh toán',
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ])
        const monthlyRevenue = revenueInMonth[0]?.totalRevenue || 0

        // Doanh thu theo tháng
        const revenueByMonth = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(year, 0, 1),
                        $lte: new Date(year, 11, 31, 23, 59, 59),
                    },
                    status: 'Đã thanh toán',
                },
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    doanhThu: { $sum: '$totalPrice' },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const fullYearRevenue = Array.from({ length: 12 }, (_, i) => {
            const match = revenueByMonth.find((item) => item._id === i + 1)
            return {
                thang: `Th${i + 1}`,
                doanhThu: match ? match.doanhThu : 0,
            }
        })

        // Doanh thu theo ngày trong tháng
        const revenueByDay = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'Đã thanh toán',
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$createdAt' },
                    doanhThu: { $sum: '$totalPrice' },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const daysInMonth = new Date(year, month, 0).getDate()
        const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const match = revenueByDay.find((item) => item._id === day)
            return {
                ngay: `Ngày ${day}`,
                doanhThu: match ? match.doanhThu : 0,
            }
        })

        return res.status(200).json({
            totalUsers,
            totalTours,
            totalBookedTours: bookedToursInMonth,
            totalCanceledTours: canceledToursInMonth,
            monthlyRevenue,
            todayRevenue,
            selectedDayRevenue,
            revenueChart: fullYearRevenue,
            dailyRevenue,
        })
    } catch (error) {
        console.error('Error loading dashboard:', error)
        return res.status(500).json({ message: 'Lỗi khi tải dữ liệu dashboard' })
    }
}
