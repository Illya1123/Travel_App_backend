import { Schema, model } from 'mongoose'

const voucherSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'], // 'percentage' = %, 'fixed' = VNĐ
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        maxDiscount: {
            type: Number,
            default: null, // chỉ áp dụng khi type là 'percentage'
        },
        minOrderValue: {
            type: Number,
            default: 0, // đơn hàng tối thiểu để áp dụng
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

export default model('Voucher', voucherSchema)
