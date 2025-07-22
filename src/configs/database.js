import mongoose from 'mongoose'

export const connectDatabase = async (MONGO_URI) => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log('✅ Database connected successfully')
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message)
        process.exit(1)
    }
}
