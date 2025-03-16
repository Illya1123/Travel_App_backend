import express from "express";
import { createMomoPayment, momoCallback, checkMomoTransaction } from "../controllers/momoController.js";

const router = express.Router();

// Tạo thanh toán MoMo
router.post("/momo", createMomoPayment);

// Xử lý callback MoMo
router.post("/momo/callback", momoCallback);

// Kiểm tra trạng thái giao dịch
router.post("/momo/status", checkMomoTransaction);

export default router;
