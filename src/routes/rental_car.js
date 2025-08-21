import express from 'express'
import {
  createCar,
  createManyCars,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
} from '../controllers/rental_car'
import { verifyAccessToken, isAdmin, isCarOwner, isCarOwnerOrAdmin } from '../middlewares/verifyToken.js'

const router = express.Router()

router.post('/',[verifyAccessToken], createCar)
router.post('/bulk',[verifyAccessToken, isAdmin], createManyCars)
router.get('/', getAllCars)
router.get('/:id', getCarById)
router.put('/:id', [verifyAccessToken, isCarOwnerOrAdmin], updateCar)
router.delete('/:id',[verifyAccessToken, isCarOwnerOrAdmin], deleteCar)

export default router
