import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDatabase } from './configs/database.js'
import initRoutes from './routes/index.js'
import cookieParser from 'cookie-parser'
import { logRoutes } from './middlewares/logRoutes.js'
import { startOrderCheckCron, startDeleteExpiredOrdersInterval } from './middlewares/orderCheck.js'

dotenv.config({
    path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
})
const app = express()
app.use(cookieParser())

const allowedOrigins = [
    'http://localhost:4000',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://travel-admin-ivory.vercel.app',
    'https://travel-web-seven-xi.vercel.app'
]

// Middlewares
app.use(cors({
    origin: function (origin, callback) {
        // Cho phép các request không có origin như từ Postman hoặc curl
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        } else {
            return callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true // nếu dùng cookie, cần bật credentials
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Kết nối MongoDB
;(async () => {
    await connectDatabase(process.env.DB_ATLAS)
})()

initRoutes(app)

// Hiển thị toàn bộ API trên terminal
// logRoutes(app);

// Chạy kiểm tra đơn hàng định kỳ
startOrderCheckCron()
startDeleteExpiredOrdersInterval()

export const viteNodeApp = app
