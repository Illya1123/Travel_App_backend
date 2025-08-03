import { Schema, model, Types } from 'mongoose'

const RoomSchema = new Schema(
    {
        accommodation: {
            type: Types.ObjectId,
            ref: 'Accommodation',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: String,
        capacity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            default: 1,
        },
        images: [String],
        amenities: [String],
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

export default model('Room', RoomSchema)
