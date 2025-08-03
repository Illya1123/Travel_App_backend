import userRouter from './user.js'
import tourRouter from './tour.js'
import paymentMethodRouter from './paymentmethod.js'
import momoRouter from './momo.js'
import tourOrderRouter from './tour_order.js'
import uploadRouter from './upload.js'
import voucherRouter from './voucher.js'
import dashboardRouter from './dashboard.js'
import commentsTourRouter from './comments_tour.js'
import rental_carRouter from './rental_car.js'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../configs/swagger-ui/swagger_output.json'
import { notFound, errHandler } from '../middlewares/errHandler.js'

const initRoutes = (app) => {
    app.use('/api/user', userRouter)
    app.use('/api/tour', tourRouter)
    app.use('/api/payment-momo', momoRouter)
    app.use('/api/tour-order', tourOrderRouter)
    app.use('/api/comments', commentsTourRouter)
    app.use('/api/rental-car', rental_carRouter)
    app.use('/api/payment-method', paymentMethodRouter)
    app.use('/api/upload', uploadRouter)
    app.use('/api/vouchers', voucherRouter)
    app.use('/api/dashboard', dashboardRouter)

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
    app.use(notFound)
    app.use(errHandler)
}

export default initRoutes
