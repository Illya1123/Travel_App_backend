import Tour from '../models/tour.js';

// Lấy danh sách tất cả các tour
export const getTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.status(200).json(tours);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: Không thể lấy danh sách tour.' });
  }
};

// Thêm mới một tour
export const createTour = async (req, res) => {
  try {
    const newTour = new Tour(req.body);
    await newTour.save();
    res.status(201).json(newTour);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: Không thể tạo tour mới.' });
  }
};

// Xóa tour theo ID
export const deleteTour = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTour = await Tour.findByIdAndDelete(id);
    if (!deletedTour) {
      return res.status(404).json({ message: 'Không tìm thấy tour để xóa.' });
    }
    res.status(200).json({ message: 'Xóa tour thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server: Không thể xóa tour.' });
  }
};
