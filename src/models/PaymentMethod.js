import { Schema, Types, model } from 'mongoose'

const Payment_MethodSchema = new Schema(
    {
        name: {
        type: String,
        required: true,
        unique: true,
        },
        disabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

export default model('PaymentMethod', Payment_MethodSchema)