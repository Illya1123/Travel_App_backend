import express from 'express'
import multer from 'multer'
import { storage, imageTourStorage } from '../ultils/cloudinary.js'

const router = express.Router()

const uploadAvatar = multer({ storage: storage })
router.post('/avatar', uploadAvatar.single('avatar'), (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(400).json({ error: 'Không có ảnh được tải lên' })
    }
    res.json({ url: req.file.path }) // Trả về URL ảnh từ Cloudinary
})

const uploadImageTour = multer({ storage: imageTourStorage })
router.post('/image_tour', uploadImageTour.single('image_tour'), (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(400).json({ error: 'Không có ảnh được tải lên' })
    }
    res.json({ url: req.file.path }) // Trả về URL ảnh tour từ Cloudinary
})

export default router
