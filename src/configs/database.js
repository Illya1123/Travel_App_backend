import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDatabase = async (MONGO_URI) => {
    console.log("🔍 MONGO_URI:", MONGO_URI);
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Error connecting to database:", error.message);
        process.exit(1);
    }
};
