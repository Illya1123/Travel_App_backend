import { Schema, Types, model } from 'mongoose'

const comments_tourSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            required: true,
            ref: 'User',
        },
        tourId: {
            type: Types.ObjectId,
            required: true,
            ref: 'Tour',
        },
        comment: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 0.5,
            max: 5,
            validate: {
                validator: function (v) {
                    return Number.isFinite(v) && v * 2 === Math.floor(v * 2)
                },
                message: 'Rating bắt buộc trong khoảng 0.5 (e.g., 0.5, 1, ..., 5)',
            },
        },
    },
    {
        timestamps: true,
    }
)

export default model('commentsTour', comments_tourSchema)
