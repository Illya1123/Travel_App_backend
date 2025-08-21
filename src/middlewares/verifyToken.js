import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import rental_car from '../models/rental_car.js'

export const verifyAccessToken = asyncHandler(async (req, res, next) => {
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err)
                return res.status(401).json({
                    success: false,
                    mes: 'Không nhận token',
                })
            req.user = decode
            next()
        })
    } else {
        return res.status(401).json({
            success: false,
            mes: 'Cần xác thực!!!',
        })
    }
})

export const isAdmin = asyncHandler((req, res, next) => {
    const { role } = req.user
    if (role !== 'admin') {
        return res.status(401).json({
            success: false,
            mes: 'CẦN QUYỀN ADMIN',
        })
    }
    next()
})

// Chỉ chủ xe mới được sửa
export const isCarOwner = asyncHandler(async (req, res, next) => {
    const carId = req.params.id

    const car = await rental_car.findById(carId)
    if (!car) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy xe',
        })
    }

    if (car.owner?.toString() !== req.user._id) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền chỉnh sửa hoặc xoá xe này',
        })
    }

    req.car = car
    next()
})

// Chủ xe HOẶC Admin đều được phép xoá/sửa
export const isCarOwnerOrAdmin = asyncHandler(async (req, res, next) => {
    const carId = req.params.id
    const userId = req.user._id
    const userRole = req.user.role

    const car = await rental_car.findById(carId)
    if (!car) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy xe',
        })
    }

    if (car.owner?.toString() === userId || userRole === 'admin') {
        req.car = car
        return next()
    }

    return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
    })
})
