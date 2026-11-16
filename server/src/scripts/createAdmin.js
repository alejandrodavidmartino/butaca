// Crea (o asciende) un usuario administrador.
// Uso: npm run create-admin -- email@ejemplo.com "Nombre" contraseña
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const [email, name = 'Administrador', password] = process.argv.slice(2);
if (!email) {
  console.log('Uso: npm run create-admin -- email "Nombre" contraseña');
  process.exit(1);
}

await connectDB();
let user = await User.findOne({ email: email.toLowerCase() });

if (user) {
  user.role = 'admin';
  await user.save();
  console.log(`✅ ${email} ahora es administrador`);
} else {
  if (!password) {
    console.log('El usuario no existe: indica también una contraseña');
    process.exit(1);
  }
  user = await User.create({ email, name, password, role: 'admin' });
  console.log(`✅ Administrador creado: ${email}`);
}
await mongoose.disconnect();
