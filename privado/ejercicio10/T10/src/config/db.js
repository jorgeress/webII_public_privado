import mongoose from 'mongoose';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ Error conectando MongoDB:', err.message);
    process.exit(1);
  }
}