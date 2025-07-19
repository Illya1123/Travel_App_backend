import Tour from '../models/tour.js'
import User from '../models/user.js'
import commentsTourModel from '../models/comments_tour.js'

// Lấy tất cả bình luận theo tour
export const getCommentsByTour = async (req, res) => {
    try {
        const { tourId } = req.params

        const comments = await commentsTourModel
            .find({ tourId })
            .populate('userId', 'name avatar')
            .sort({ createdAt: -1 })
            .lean()

        res.status(200).json({
            status: 'success',
            results: comments.length,
            data: comments.map((comment) => ({
                _id: comment._id,
                comment: comment.comment,
                rating: comment.rating,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                user: {
                    _id: comment.userId._id,
                    name: comment.userId.name,
                    avatar: comment.userId.avatar,
                },
                tourId: comment.tourId,
            })),
        })
    } catch (error) {
        console.error('Lỗi khi lấy bình luận:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể lấy bình luận',
        })
    }
}

// Tạo mới bình luận
export const createComment = async (req, res) => {
    try {
        const { userId, tourId, comment, rating } = req.body

        // Kiểm tra đầu vào
        if (![userId, tourId, comment, rating].every(Boolean)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Thiếu thông tin: userId, tourId, comment hoặc rating',
            })
        }

        // Kiểm tra user tồn tại
        const user = await User.findById(userId).lean()
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy người dùng',
            })
        }

        // Kiểm tra rating nằm trong khoảng [0.5, 5], bội số của 0.5
        if (rating < 0.5 || rating > 5 || rating * 2 !== Math.floor(rating * 2)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Rating phải nằm trong khoảng từ 0.5 đến 5 (tăng dần mỗi 0.5)',
            })
        }

        // Lưu bình luận
        const newComment = await commentsTourModel.create({
            userId,
            tourId,
            comment,
            rating,
        })

        res.status(201).json({
            status: 'success',
            data: {
                _id: newComment._id,
                comment: newComment.comment,
                rating: newComment.rating,
                createdAt: newComment.createdAt,
                user: {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                },
                tourId: newComment.tourId,
            },
        })
    } catch (error) {
        console.error('Lỗi khi tạo bình luận:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể tạo bình luận',
        })
    }
}

export const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params
        const { userId, comment, rating } = req.body

        if (!userId || !comment || !rating) {
            return res.status(400).json({
                status: 'fail',
                message: 'Thiếu thông tin userId, comment hoặc rating',
            })
        }

        const existing = await commentsTourModel.findById(commentId)
        if (!existing) {
            return res.status(404).json({ status: 'fail', message: 'Không tìm thấy bình luận' })
        }

        // Kiểm tra quyền
        if (existing.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ status: 'fail', message: 'Không có quyền chỉnh sửa bình luận này' })
        }

        existing.comment = comment
        existing.rating = rating
        await existing.save()

        res.status(200).json({ status: 'success', data: existing })
    } catch (error) {
        console.error('Lỗi khi cập nhật bình luận:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể cập nhật bình luận',
        })
    }
}
