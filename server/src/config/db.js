import mongoose from 'mongoose';

// Conecta con MongoDB usando la URI del .env (local o Atlas)
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Falta la variable de entorno MONGODB_URI (en local: server/.env · en Render: Environment del servicio)'
    );
  }

  // dbName fija el nombre de la base de datos aunque la URI no lo incluya
  // (si no, Atlas usaría por defecto una llamada "test")
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'butaca' });
  console.log(`🍃 MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
