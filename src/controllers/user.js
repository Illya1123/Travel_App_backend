import User from '../models/user.js'
import OTP from '../models/otp.js'
import asyncHandler from 'express-async-handler'
import { generateAccessToken, generateRefreshToken } from '../middlewares/jwt.js'
import jwt from 'jsonwebtoken'
import sendMail from '../ultils/sendMail.js'
import crypto from 'crypto'

// Lưu trữ OTP tạm thời (tốt hơn là dùng Redis hoặc DB)
const otpStore = {}

// Gửi mã OTP tới email
export const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) throw new Error('Missing email')

    // Tạo mã OTP ngẫu nhiên
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    // Thời gian hết hạn OTP (15 phút)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Cập nhật hoặc tạo mới OTP cho email
    await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true })

    // Gửi mã OTP qua email
    const html = `<p><b>Travel App</b>: Mã OTP của bạn là: <b>${otp}</b><br> 
        Có hiệu lực trong 15 phút. Không chia sẻ OTP với bất kỳ ai.<br>
        Trân trọng!</p>`

    await sendMail({ email, html })

    return res.status(200).json({ success: true, message: 'OTP sent to email' })
})

// Xác thực mã OTP
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    if (!email || !otp) throw new Error('Missing inputs')

    // Tìm OTP trong MongoDB
    const storedOtpData = await OTP.findOne({ email }).sort({ expiresAt: -1 })

    if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    }

    // Xóa OTP sau khi xác thực thành công
    await OTP.deleteOne({ _id: storedOtpData._id })

    return res.status(200).json({ success: true, message: 'OTP verified' })
})

export const register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body
    if (!email || !password || !name)
        return res.status(400).json({
            success: false,
            mes: 'Missing inputs',
        })

    const user = await User.findOne({ email })
    if (user) throw new Error('User has existed')
    else {
        const newUser = await User.create(req.body)
        return res.status(200).json({
            success: newUser ? true : false,
            mes: newUser ? 'Register is successfully. Please go login~' : 'Something went wrong',
        })
    }
})
// Refresh token => Cấp mới access token
// Access token => Xác thực người dùng, quân quyên người dùng
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({
            sucess: false,
            mes: 'Missing inputs',
        })
    // plain object
    const response = await User.findOne({ email })
    if (response && (await response.isCorrectPassword(password))) {
        // Tách password và role ra khỏi response
        const { password, role, refreshToken, ...userData } = response.toObject()
        // Tạo access token
        const accessToken = generateAccessToken(response._id, role)
        // Tạo refresh token
        const newRefreshToken = generateRefreshToken(response._id)
        // Lưu refresh token vào database
        await User.findByIdAndUpdate(response._id, { refreshToken: newRefreshToken }, { new: true })
        // Lưu refresh token vào cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({
            sucess: true,
            accessToken,
            userData,
        })
    } else {
        throw new Error('Invalid credentials!')
    }
})
export const getCurrent = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const user = await User.findById(_id).select('-refreshToken -password -role')
    return res.status(200).json({
        success: user ? true : false,
        rs: user ? user : 'User not found',
    })
})
export const refreshAccessToken = asyncHandler(async (req, res) => {
    // Lấy token từ cookies
    const cookie = req.cookies
    // Check xem có token hay không
    if (!cookie && !cookie.refreshToken) throw new Error('No refresh token in cookies')
    // Check token có hợp lệ hay không
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)
    const response = await User.findOne({ _id: rs._id, refreshToken: cookie.refreshToken })
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response
            ? generateAccessToken(response._id, response.role)
            : 'Refresh token not matched',
    })
})

export const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if (!cookie || !cookie.refreshToken) throw new Error('No refresh token in cookies')
    // Xóa refresh token ở db
    await User.findOneAndUpdate(
        { refreshToken: cookie.refreshToken },
        { refreshToken: '' },
        { new: true }
    )
    // Xóa refresh token ở cookie trình duyệt
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
    })
    return res.status(200).json({
        success: true,
        mes: 'Logout is done',
    })
})
// Client gửi email
// Server check email có hợp lệ hay không => Gửi mail + kèm theo link (password change token)
// Client check mail => click link
// Client gửi api kèm token
// Check token có giống với token mà server gửi mail hay không
// Change password

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.query
    if (!email) throw new Error('Missing email')
    const user = await User.findOne({ email })
    if (!user) throw new Error('User not found')
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn.Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=${process.env.URL_SERVER}/api/user/resetpassword/${resetToken}>Click here</a>`

    const data = {
        email,
        html,
    }
    const rs = await sendMail(data)
    return res.status(200).json({
        success: true,
        rs,
    })
})
export const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body
    if (!password || !token) throw new Error('Missing inputs')
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    })
    if (!user) throw new Error('Invalid reset token')
    user.password = password
    user.passwordResetToken = undefined
    user.passwordChangedAt = Date.now()
    user.passwordResetExpires = undefined
    await user.save()
    return res.status(200).json({
        success: user ? true : false,
        mes: user ? 'Updated password' : 'Something went wrong',
    })
})

// Gửi mã OTP khi quên mật khẩu
export const forgotPasswordUseOTP = asyncHandler(async (req, res) => {
    const { email } = req.query
    if (!email) throw new Error('Vui lòng nhập email')

    const user = await User.findOne({ email })
    if (!user) throw new Error('Người dùng không tồn tại')

    // Tạo mã OTP 4 chữ số
    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    // Thời gian hết hạn (15 phút)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Cập nhật hoặc tạo mới OTP cho email
    await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true })

    // Nội dung email
    const html = `<p><b>Travel App</b>: Mã OTP đặt lại mật khẩu của bạn là: <b>${otp}</b><br> 
    Mã này có hiệu lực trong 15 phút. Không chia sẻ OTP với bất kỳ ai.<br>
    Trân trọng!</p>`

    // Gửi email chứa OTP
    await sendMail({ email, html })

    return res.status(200).json({ success: true, message: 'OTP đã được gửi đến email' })
})

// Xác thực OTP và đặt lại mật khẩu
export const resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) throw new Error('Thiếu thông tin đầu vào')

    // Kiểm tra OTP trong MongoDB
    const storedOtpData = await OTP.findOne({ email }).sort({ expiresAt: -1 })

    if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP sai hoặc đã hết hạn' })
    }

    // Tìm user và đặt lại mật khẩu
    const user = await User.findOne({ email })
    if (!user) throw new Error('Người dùng không tồn tại')

    user.password = newPassword
    await user.save()

    // Xóa OTP sau khi sử dụng
    await OTP.deleteOne({ _id: storedOtpData._id })

    return res.status(200).json({ success: true, message: 'Mật khẩu đã được đặt lại thành công' })
})

export const getUsers = asyncHandler(async (req, res) => {
    const response = await User.find().select('-refreshToken -password -role')
    return res.status(200).json({
        success: response ? true : false,
        users: response,
    })
})
export const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.query
    if (!_id) throw new Error('Missing inputs')
    const response = await User.findByIdAndDelete(_id)
    return res.status(200).json({
        success: response ? true : false,
        deletedUser: response ? `User with email ${response.email} deleted` : 'No user delete',
    })
})
export const updateUser = asyncHandler(async (req, res) => {
    //
    const { _id } = req.user
    if (!_id || Object.keys(req.body).length === 0) throw new Error('Missing inputs')
    const response = await User.findByIdAndUpdate(_id, req.body, { new: true }).select(
        '-password -role -refreshToken'
    )
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Some thing went wrong',
    })
})
export const updateUserByAdmin = asyncHandler(async (req, res) => {
    //
    const { uid } = req.params
    if (Object.keys(req.body).length === 0) throw new Error('Missing inputs')
    const response = await User.findByIdAndUpdate(uid, req.body, { new: true }).select(
        '-password -role -refreshToken'
    )
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Some thing went wrong',
    })
})

export const updateInfoContactUser = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { mobile, address, dateOfBirth } = req.body

    if (!_id) throw new Error('Missing user ID')
    if (!mobile && !address && !dateOfBirth) {
        return res.status(400).json({ success: false, message: 'No updates provided' })
    }

    const updateFields = {}
    if (mobile) updateFields.mobile = mobile
    if (address) updateFields.address = address
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth

    const updatedUser = await User.findByIdAndUpdate(_id, updateFields, { new: true }).select(
        '-password -role -refreshToken'
    )

    return res.status(200).json({
        success: updatedUser ? true : false,
        updatedUser: updatedUser || 'Something went wrong',
    })
})
