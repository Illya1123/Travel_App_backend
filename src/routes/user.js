import express from 'express'
import {
    register,
    login,
    getCurrent,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    forgotPasswordUseOTP,
    resetPasswordWithOTP,
    getUsers,
    deleteUser,
    updateUser,
    updateInfoContactUser,
    updateUserByAdmin,
    sendOTP,
    verifyOTP,
} from '../controllers/user.js'

import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

// User authentication & registration
router.post('/register', register)
router.post('/login', login)
router.get('/current', verifyAccessToken, getCurrent)
router.post('/refreshtoken', refreshAccessToken)
router.get('/logout', logout)
router.put('/updateInfoContactUser', verifyAccessToken, updateInfoContactUser)

// Password recovery
router.get('/forgotpassword', forgotPassword)
router.put('/resetpassword', resetPassword)
router.put('/resetpassword/:token', resetPassword)

//for mobile version
router.get('/forgotPasswordWithOtp', forgotPasswordUseOTP)
router.put('/resetPasswordWithOtp', resetPasswordWithOTP)

// Admin routes (require admin permission)
router.get('/', [verifyAccessToken, isAdmin], getUsers)
router.delete('/', [verifyAccessToken, isAdmin], deleteUser)
router.put('/current', [verifyAccessToken], updateUser)
router.put('/:uid', [verifyAccessToken, isAdmin], updateUserByAdmin)

// Gửi mã OTP tới email
router.post('/send-otp', sendOTP)

// Xác thực mã OTP
router.post('/verify-otp', verifyOTP)

export default router
