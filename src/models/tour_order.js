import { Schema, Types, model } from "mongoose";

const tourOrderSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
      ref: "User",
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Chưa hoàn thành giao dịch", "Đã đặt", "Đã thanh toán", "Đã hủy"],
    },
    tour: [
      {
        tourId: {
          type: Types.ObjectId,
          required: true,
          ref: "Tour",
        },
        numberOfChildren: {
          type: Number,
          required: true,
        },
        numberOfAdults: {
          type: Number,
          required: true,
        },
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Tiền mặt", "Chuyển khoản"],
    },
    note: {
      type: String,
      default: "",
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("TourOrder", tourOrderSchema);