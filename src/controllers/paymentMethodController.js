import PaymentMethod from '../models/PaymentMethod.js'

// Lấy tất cả phương thức thanh toán
export const getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.find().lean()

        res.status(200).json({
            status: 'success',
            results: methods.length,
            data: methods.map((method) => ({
                _id: method._id,
                name: method.name,
                disabled: method.disabled,
            })),
        })
    } catch (error) {
        console.error('Lỗi khi lấy phương thức thanh toán:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể lấy phương thức thanh toán',
        })
    }
}

// Seed phương thức thanh toán (1 lần duy nhất)
export const seedPaymentMethods = async (req, res) => {
    try {
        const defaultMethods = [
            { name: 'MoMo', disabled: false },
            { name: 'VNPay', disabled: true },
            { name: 'ZaloPay', disabled: true },
            { name: 'Tiền Mặt', disabled: true },
        ]

        await PaymentMethod.deleteMany()
        const created = await PaymentMethod.insertMany(defaultMethods)

        res.status(201).json({
            status: 'success',
            message: 'Khởi tạo thành công các phương thức thanh toán',
            data: created,
        })
    } catch (error) {
        console.error('Lỗi khi seed phương thức:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể khởi tạo phương thức thanh toán',
        })
    }
}

// Cập nhật trạng thái enable/disable theo name
export const updatePaymentMethodStatus = async (req, res) => {
    try {
        const { name } = req.params
        const { disabled } = req.body

        if (typeof disabled !== 'boolean') {
            return res.status(400).json({
                status: 'fail',
                message: 'Trường "disabled" phải là boolean',
            })
        }

        const updated = await PaymentMethod.findOneAndUpdate(
            { name },
            { disabled },
            { new: true }
        )

        if (!updated) {
            return res.status(404).json({
                status: 'fail',
                message: `Không tìm thấy phương thức "${name}"`,
            })
        }

        res.status(200).json({
            status: 'success',
            data: updated,
        })
    } catch (error) {
        console.error('Lỗi khi cập nhật phương thức:', error)
        res.status(500).json({
            status: 'error',
            message: 'Không thể cập nhật phương thức thanh toán',
        })
    }
}
