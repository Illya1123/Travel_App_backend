import TourOrder from "../models/tour_order.js";
import User from "../models/user.js";
import Tour from "../models/tour.js";
import mongoose from "mongoose";

// Tạo đơn đặt tour
export const createTourOrder = async (req, res) => {
  try {
    const { userId, tour, paymentMethod, note, totalPrice } = req.body;

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });

    // Kiểm tra tour có tồn tại không
    for (const item of tour) {
      const tourExists = await Tour.findById(item.tourId);
      if (!tourExists) return res.status(404).json({ message: "Tour không tồn tại!" });
    }

    const newOrder = new TourOrder({
      userId,
      status: "Đã đặt",
      tour,
      paymentMethod,
      note,
      totalPrice,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo đơn đặt tour!", error: error.message });
  }
};

// Lấy danh sách tất cả đơn đặt tour
export const getAllTourOrders = async (req, res) => {
  try {
    const orders = await TourOrder.find().populate("userId", "name email").populate("tour.tourId", "title price");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn đặt tour!", error: error.message });
  }
};

// Lấy chi tiết đơn đặt tour theo ID
export const getTourOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "UserId không hợp lệ!" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Tìm tất cả đơn hàng của user, sử dụng .lean() để loại bỏ metadata của Mongoose
    const orders = await TourOrder.find({ userId: userObjectId })
      .populate("userId", "name email") // Lấy thông tin user
      .populate({
        path: "tour.tourId",
        select: "title price services overview country image date", // Lấy thông tin tour
      })
      .lean();

    if (!orders.length) {
      return res.status(404).json({ message: "Không có đơn đặt tour nào cho người dùng này!" });
    }

    // Lấy thông tin user từ đơn đặt tour đầu tiên
    const userInfo = {
      name: orders[0].userId.name,
      email: orders[0].userId.email,
    };

    // Loại bỏ userId khỏi từng order
    const formattedOrders = orders.map(({ userId, ...order }) => order);

    res.status(200).json({
      user: userInfo,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("❌ Lỗi server:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn đặt tour!", error: error.message });
  }
};

// Cập nhật trạng thái đơn đặt tour
export const updateTourOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Đã đặt", "Đã thanh toán", "Đã hủy"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ!" });
    }

    const updatedOrder = await TourOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Đơn đặt tour không tồn tại!" });

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái đơn đặt tour!", error: error.message });
  }
};

// Xóa đơn đặt tour
export const deleteTourOrder = async (req, res) => {
  try {
    const deletedOrder = await TourOrder.findByIdAndDelete(req.params.id);

    if (!deletedOrder) return res.status(404).json({ message: "Đơn đặt tour không tồn tại!" });

    res.status(200).json({ message: "Xóa đơn đặt tour thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa đơn đặt tour!", error: error.message });
  }
};
