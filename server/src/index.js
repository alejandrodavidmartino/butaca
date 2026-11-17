// Punto de entrada del backend de Butaca
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
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
app.use('/api/movies', movieRoutes);

// Manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

// Aviso temprano si falta la credencial de TMDB
if (!process.env.TMDB_READ_TOKEN && !process.env.TMDB_API_KEY) {
  console.warn('⚠️  Falta TMDB_READ_TOKEN (o TMDB_API_KEY) en server/.env: el catálogo no funcionará');
}

// Primero conectamos a la base de datos y después arrancamos el servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🎬 Butaca API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
