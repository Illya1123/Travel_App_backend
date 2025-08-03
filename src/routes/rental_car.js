import express from 'express'
import {
  createCar,
  createManyCars,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
} from '../controllers/rental_car'

const router = express.Router()

router.post('/', createCar)
router.post('/bulk', createManyCars)
router.get('/', getAllCars)
router.get('/:id', getCarById)
router.put('/:id', updateCar)
router.delete('/:id', deleteCar)

export default router
