import User from '../models/user.js'
import OTP from '../models/otp.js'
import asyncHandler from 'express-async-handler'
import { generateAccessToken, generateRefreshToken } from '../middlewares/jwt.js'
import jwt from 'jsonwebtoken'
import sendMail from '../ultils/sendMail.js'
import crypto from 'crypto'

// Gửi mã OTP tới email
export const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) throw new Error('Missing email')

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true })

    const html = `<p><b>Travel App</b>: Mã OTP của bạn là: <b>${otp}</b><br> 
        Có hiệu lực trong 15 phút. Không chia sẻ OTP với bất kỳ ai.<br> Trân trọng!</p>`

    await sendMail({ email, html })
    return res.status(200).json({ success: true, message: 'OTP sent to email' })
})

export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    if (!email || !otp) throw new Error('Missing inputs')

    const storedOtpData = await OTP.findOne({ email }).sort({ expiresAt: -1 })

    if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    }

    await OTP.deleteOne({ _id: storedOtpData._id })
    return res.status(200).json({ success: true, message: 'OTP verified' })
})

export const register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body
    if (!email || !password || !name)
        return res.status(400).json({ success: false, mes: 'Missing inputs' })

    const user = await User.findOne({ email })
    if (user) throw new Error('User has existed')

    const newUser = await User.create(req.body)
    return res.status(200).json({
        success: !!newUser,
        mes: newUser ? 'Register is successfully. Please go login~' : 'Something went wrong',
    })
})

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ sucess: false, mes: 'Missing inputs' })

    const response = await User.findOne({ email })
    if (response && (await response.isCorrectPassword(password))) {
        const { password, role, refreshToken, _id, ...rest } = response.toObject()
        const userData = { id: _id, ...rest }

        const accessToken = generateAccessToken(_id, role)
        const newRefreshToken = generateRefreshToken(_id)

        await User.findByIdAndUpdate(_id, { refreshToken: newRefreshToken }, { new: true })

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(200).json({ sucess: true, accessToken, userData })
    } else {
        throw new Error('Invalid credentials!')
    }
})

export const getCurrent = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const user = await User.findById(_id).select('-refreshToken -password -role').lean()

    if (user) {
        user.id = user._id
        delete user._id
    }

    return res.status(200).json({
        success: !!user,
        rs: user || 'User not found',
    })
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if (!cookie || !cookie.refreshToken) throw new Error('No refresh token in cookies')

    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)
    const response = await User.findOne({ _id: rs._id, refreshToken: cookie.refreshToken })

    return res.status(200).json({
        success: !!response,
        newAccessToken: response
            ? generateAccessToken(response._id, response.role)
            : 'Refresh token not matched',
    })
})

export const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if (!cookie || !cookie.refreshToken) throw new Error('No refresh token in cookies')

    await User.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: '' })
    res.clearCookie('refreshToken', { httpOnly: true, secure: true })

    return res.status(200).json({ success: true, mes: 'Logout is done' })
})

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.query
    if (!email) throw new Error('Missing email')

    const user = await User.findOne({ email })
    if (!user) throw new Error('User not found')

    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4000'
    const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút.<br> 
    <a href="${clientUrl}/reset-password/${resetToken}" target="_blank">Đổi mật khẩu tại đây</a>`

    await sendMail({ email, html })
    return res.status(200).json({ success: true })
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
        success: !!user,
        mes: user ? 'Updated password' : 'Something went wrong',
    })
})

export const forgotPasswordUseOTP = asyncHandler(async (req, res) => {
    const { email } = req.query
    if (!email) throw new Error('Vui lòng nhập email')

    const user = await User.findOne({ email })
    if (!user) throw new Error('Người dùng không tồn tại')

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true, new: true })

    const html = `<p><b>Travel App</b>: Mã OTP đặt lại mật khẩu của bạn là: <b>${otp}</b><br> 
    Mã này có hiệu lực trong 15 phút. Không chia sẻ OTP với bất kỳ ai.<br> Trân trọng!</p>`

    await sendMail({ email, html })
    return res.status(200).json({ success: true, message: 'OTP đã được gửi đến email' })
})

export const resetPasswordWithOTP = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) throw new Error('Thiếu thông tin đầu vào')

    const storedOtpData = await OTP.findOne({ email }).sort({ expiresAt: -1 })

    if (!storedOtpData || storedOtpData.otp !== otp || storedOtpData.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP sai hoặc đã hết hạn' })
    }

    const user = await User.findOne({ email })
    if (!user) throw new Error('Người dùng không tồn tại')

    user.password = newPassword
    await user.save()
    await OTP.deleteOne({ _id: storedOtpData._id })

    return res.status(200).json({ success: true, message: 'Mật khẩu đã được đặt lại thành công' })
})

export const getUsers = asyncHandler(async (req, res) => {
    const response = await User.find().select('-refreshToken -password -role').lean()
    const users = response.map(({ _id, ...rest }) => ({ id: _id, ...rest }))

    return res.status(200).json({ success: true, users })
})

export const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.query
    if (!_id) throw new Error('Missing inputs')

    const response = await User.findByIdAndDelete(_id).lean()
    if (response) {
        response.id = response._id
        delete response._id
    }

    return res.status(200).json({
        success: !!response,
        deletedUser: response ? `User with email ${response.email} deleted` : 'No user deleted',
    })
})

export const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user
    if (!_id || Object.keys(req.body).length === 0) throw new Error('Missing inputs')

    const response = await User.findByIdAndUpdate(_id, req.body, { new: true })
        .select('-password -role -refreshToken')
        .lean()

    if (response) {
        response.id = response._id
        delete response._id
    }

    return res.status(200).json({
        success: !!response,
        updatedUser: response || 'Something went wrong',
    })
})

export const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { uid } = req.params
    if (Object.keys(req.body).length === 0) throw new Error('Missing inputs')

    const response = await User.findByIdAndUpdate(uid, req.body, { new: true })
        .select('-password -role -refreshToken')
        .lean()

    if (response) {
        response.id = response._id
        delete response._id
    }

    return res.status(200).json({
        success: !!response,
        updatedUser: response || 'Something went wrong',
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

    const updatedUser = await User.findByIdAndUpdate(_id, updateFields, { new: true })
        .select('-password -role -refreshToken')
        .lean()

    if (updatedUser) {
        updatedUser.id = updatedUser._id
        delete updatedUser._id
    }

    return res.status(200).json({
        success: !!updatedUser,
        updatedUser: updatedUser || 'Something went wrong',
    })
})

export const updateUserInfo = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { name, avatar, mobile, gender, address, dateOfBirth } = req.body

    if (!_id) throw new Error('Thiếu ID người dùng')

    const updateFields = {}
    if (name) updateFields.name = name
    if (avatar) updateFields.avatar = avatar
    if (mobile) updateFields.mobile = mobile
    if (gender) updateFields.gender = gender
    if (address) updateFields.address = address
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth

    const updatedUser = await User.findByIdAndUpdate(_id, updateFields, { new: true })
        .select('-password -refreshToken -role')
        .lean()

    if (updatedUser) {
        updatedUser.id = updatedUser._id
        delete updatedUser._id
    }

    return res.status(200).json({
        success: !!updatedUser,
        updatedUser: updatedUser || 'Không thể cập nhật người dùng',
    })
})

export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, mes: 'Missing inputs' })

    const response = await User.findOne({ email })
    if (!response || !(await response.isCorrectPassword(password)))
        throw new Error('Invalid credentials!')

    if (response.role !== 'admin') {
        return res.status(403).json({ success: false, mes: 'Bạn không có quyền truy cập admin' })
    }

    const { password: pwd, refreshToken, _id, ...rest } = response.toObject()
    const userData = { id: _id, ...rest }

    const accessToken = generateAccessToken(_id, response.role)
    const newRefreshToken = generateRefreshToken(_id)

    await User.findByIdAndUpdate(_id, { refreshToken: newRefreshToken }, { new: true })

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({ success: true, accessToken, userData })
})