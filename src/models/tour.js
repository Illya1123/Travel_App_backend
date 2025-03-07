import { Schema, Types, model } from "mongoose";

const tourSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  score: {
    type: String,
  },
  score_description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  services: {
    type: [String],
  },
  overview: {
    type: [String],
  },
  type: {
    type: String,
    required: true,
    enum: ['Tour Nước Ngoài', 'Tour Trong Nước'],
  },
  country: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default model("Tour", tourSchema);
