import mongoose from 'mongoose';

const dbConnect = async () => {
  try {
    const uri = process.env.MONGODB_URI; 
    
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB local');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export default dbConnect;