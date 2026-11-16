import mongoose from 'mongoose';

// Conecta con MongoDB usando la URI del .env (local o Atlas)
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Falta la variable MONGODB_URI en el .env');

  await mongoose.connect(uri);
  console.log(`🍃 MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
