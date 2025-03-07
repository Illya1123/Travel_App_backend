import express from 'express'
import { 
    register, 
    login, 
    getCurrent, 
    refreshAccessToken, 
    logout, 
    forgotPassword, 
    resetPassword, 
    getUsers, 
    deleteUser, 
    updateUser, 
    updateUserByAdmin,
    sendOTP,
    verifyOTP 
} from '../controllers/user.js'

import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

// User authentication & registration
router.post('/register', register)
router.post('/login', login)
router.get('/current', verifyAccessToken, getCurrent)
router.post('/refreshtoken', refreshAccessToken)
router.get('/logout', logout)

// Password recovery
router.get('/forgotpassword', forgotPassword)
router.put('/resetpassword', resetPassword)

// Admin routes (require admin permission)
router.get('/', [verifyAccessToken, isAdmin], getUsers)
router.delete('/', [verifyAccessToken, isAdmin], deleteUser)
router.put('/current', [verifyAccessToken], updateUser)
router.put('/:uid', [verifyAccessToken, isAdmin], updateUserByAdmin)

// Gửi mã OTP tới email
router.post('/send-otp', sendOTP)

// Xác thực mã OTP
router.post('/verify-otp', verifyOTP)

// Đăng ký tài khoản (chỉ được gọi khi OTP hợp lệ)
router.post('/register', register)

export default router
