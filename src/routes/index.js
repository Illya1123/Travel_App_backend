import userRouter from './user.js'
import tourRouter from './tour.js'
import { notFound, errHandler } from '../middlewares/errHandler.js'

const initRoutes = (app) => {
    app.use('/api/user', userRouter)
    app.use('/api/tour', tourRouter)



    app.use(notFound)
    app.use(errHandler)
}

export default initRoutes