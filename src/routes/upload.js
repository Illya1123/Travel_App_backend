import express from 'express'
import multer from 'multer'
import { storage } from '../ultils/cloudinary.js'

const router = express.Router()
const upload = multer({ storage })

router.post('/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file || !req.file.path) {
        return res.status(400).json({ error: 'Không có ảnh được tải lên' })
    }
    res.json({ url: req.file.path }) // Trả về URL ảnh từ Cloudinary
})

export default router
