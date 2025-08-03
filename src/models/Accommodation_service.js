import { Schema, model } from 'mongoose'

const AccommodationSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['hotel', 'home_stay', 'resort', 'motel'],
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: [String],
            required: true,
        },
        phone_number: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        coordinates: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },
        services: {
            type: [String],
        },
        overview: {
            type: String,
        },
        social_network_link: {
            facebook: {
                type: String,
            },
            tiktok: {
                type: String,
            },
        },
        Note: {
            type: String,
        },
        collaborators: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
)

export default model('Accommodation', AccommodationSchema)
