import User from '../models/user.js'
import Tour from '../models/tour.js'
import TourOrder from '../models/tour_order.js'

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments()
        const totalTours = await Tour.countDocuments()

        const currentYear = new Date().getFullYear()
        const year = parseInt(req.query.year) || currentYear

        const startOfMonth = new Date(year, new Date().getMonth(), 1)
        const endOfMonth = new Date(year, new Date().getMonth() + 1, 0)

        // Tổng tour đã đặt trong tháng
        const bookedToursInMonth = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: { $in: ['Đã đặt', 'Đã thanh toán'] },
                },
            },
            {
                $project: {
                    tourCount: { $size: '$tour' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$tourCount' },
                },
            },
        ])
        const totalBookedTours = bookedToursInMonth[0]?.total || 0

        // Tổng tour đã bị huỷ trong tháng
        const canceledToursInMonth = await TourOrder.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'Đã hủy',
                },
            },
            {
                $project: {
                    canceledCount: { $size: '$tour' },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$canceledCount' },
                },
            },
        ])
        const totalCanceledTours = canceledToursInMonth[0]?.total || 0

        // Tổng doanh thu tháng
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

        // Doanh thu theo 12 tháng trong năm được chọn
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

        return res.status(200).json({
            totalUsers,
            totalTours,
            totalBookedTours,
            totalCanceledTours,
            monthlyRevenue,
            revenueChart: fullYearRevenue,
        })
    } catch (error) {
        console.error('Error loading dashboard:', error)
        return res.status(500).json({ message: 'Lỗi khi tải dữ liệu dashboard' })
    }
}
