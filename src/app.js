import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDatabase } from './configs/database.js'
import initRoutes from './routes/index.js'
import cookieParser from 'cookie-parser'
import { logRoutes } from './middlewares/logRoutes.js'
import { startOrderCheckCron, startDeleteExpiredOrdersInterval } from './middlewares/orderCheck.js'

dotenv.config()
const app = express()
app.use(cookieParser())

// Middlewares
app.use(cors())
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
