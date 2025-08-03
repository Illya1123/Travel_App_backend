import Car from '../models/rental_car'

// Tạo mới một xe
export const createCar = async (req, res) => {
    try {
        const newCar = await Car.create({
            ...req.body,
            owner: req.user._id // <-- tự gán nếu đang đăng nhập
        })
        res.status(201).json(newCar)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Tạo nhiều xe một lượt
export const createManyCars = async (req, res) => {
    try {
        const cars = req.body // req.body nên là một mảng các object
        if (!Array.isArray(cars) || cars.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu phải là mảng và không được rỗng' })
        }

        const createdCars = await Car.insertMany(cars)
        res.status(201).json({
            message: `Đã tạo ${createdCars.length} xe thành công`,
            data: createdCars,
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Lấy danh sách tất cả các xe
export const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find().populate('owner', 'name email mobile')
        res.status(200).json(cars)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Lấy chi tiết 1 xe theo ID
export const getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('owner', 'name email mobile')
        if (!car) return res.status(404).json({ message: 'Không tìm thấy xe' })
        res.status(200).json(car)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Cập nhật thông tin xe
export const updateCar = async (req, res) => {
    try {
        const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
        if (!updatedCar) return res.status(404).json({ message: 'Không tìm thấy xe để cập nhật' })
        res.status(200).json(updatedCar)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

// Xoá xe
export const deleteCar = async (req, res) => {
    try {
        const deletedCar = await Car.findByIdAndDelete(req.params.id)
        if (!deletedCar) return res.status(404).json({ message: 'Không tìm thấy xe để xoá' })
        res.status(200).json({ message: 'Xoá thành công' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
