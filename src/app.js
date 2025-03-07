import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDatabase } from './configs/database.js';
import initRoutes from './routes/index.js';
import cookieParser from 'cookie-parser';

dotenv.config();
const app = express();
app.use(cookieParser());

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
(async () => {
    await connectDatabase(process.env.DATABASE_URI);
})();

initRoutes(app);

export const viteNodeApp = app;