import { Schema, model, Types } from 'mongoose'

const carSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    seats: {
      type: Number,
      required: true,
    },
    transmission: {
      type: String,
      enum: ['Tự động', 'Số sàn'],
      required: true,
    },
    fuel: {
      type: String,
      enum: ['Xăng', 'Điện', 'Hybrid', 'Dầu'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    badges: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Sẵn sàng', 'Đang thuê', 'Bảo trì'],
      default: 'Sẵn sàng',
    },
    image: {
      type: [String],
      required: true,
    },
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
)

export default model('Car', carSchema)
