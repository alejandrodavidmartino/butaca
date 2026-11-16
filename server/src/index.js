// Punto de entrada del backend de Butaca
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Ruta de comprobación: sirve para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Butaca API', time: new Date().toISOString() });
});

// Rutas de la API
app.use('/api/auth', authRoutes);

// Manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

// Primero conectamos a la base de datos y después arrancamos el servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🎬 Butaca API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
