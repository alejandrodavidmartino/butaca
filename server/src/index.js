// Punto de entrada del backend de Butaca
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movieRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import meRoutes from './routes/meRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import User from './models/User.js';
import { syncGroupRatingsToDiaries } from './scripts/syncDiaries.js';
import { describeTmdbCredential, tmdbPing } from './services/tmdb.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Render/Vercel ponen un proxy delante: así req.ip es la IP real del usuario (para el límite de la IA)
app.set('trust proxy', 1);

// CORS: solo el frontend puede llamar a la API. CLIENT_URL admite varias URLs separadas por comas
// (p. ej. "https://butaca.vercel.app,http://localhost:5173")
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // Sin "origin" = peticiones desde el servidor, curl o la propia <img>: se permiten
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
  })
);

// Middlewares globales
app.use(express.json({ limit: '1mb' })); // 1 MB para poder subir fotos de grupo

// Raíz: pequeña presentación de la API (útil si alguien abre la URL del backend en el navegador)
app.get('/', (_req, res) => {
  res.json({
    app: 'Butaca API 🎬🐀',
    description: 'API REST de Butaca: recomendador de películas con IA (Express + MongoDB + TMDB + Gemini)',
    health: '/api/health',
    web: (process.env.CLIENT_URL || '').split(',')[0].trim() || null,
  });
});

// Ruta de comprobación: sirve para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Butaca API', time: new Date().toISOString() });
});

// Diagnóstico de TMDB (sin mostrar nunca la clave): ¿hay credencial?, ¿de qué tipo?, ¿qué responde TMDB?
app.get('/api/health/tmdb', async (_req, res) => {
  const credential = describeTmdbCredential();
  try {
    await tmdbPing();
    res.json({ ok: true, credential, tmdb: 'TMDB responde correctamente' });
  } catch (err) {
    const status = err.response?.status;
    res.status(502).json({
      ok: false,
      credential,
      tmdbStatus: status || null,
      tmdb:
        status === 401
          ? 'TMDB rechaza la credencial (401): está mal copiada, incompleta o es de otra cuenta'
          : status
            ? `TMDB respondió con error ${status}`
            : `No se pudo contactar con TMDB (${err.code || err.message})`,
    });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/collections', collectionRoutes);

// Manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

// Aviso temprano sobre la credencial de TMDB (sin mostrar su valor)
if (!process.env.TMDB_READ_TOKEN && !process.env.TMDB_API_KEY) {
  console.warn('⚠️  Falta TMDB_READ_TOKEN (o TMDB_API_KEY): el catálogo no funcionará');
} else {
  console.log(`🎞️  TMDB: usando ${describeTmdbCredential()}`);
}

// Primero conectamos a la base de datos y después arrancamos el servidor
connectDB()
  .then(async () => {
    // Cuentas creadas antes de existir el @usuario: les generamos uno
    for (const u of await User.find({ username: { $exists: false } })) await u.save();
    // Notas puestas en grupos antes de existir "Mis vistas": las copiamos al diario de cada uno
    await syncGroupRatingsToDiaries();

    app.listen(PORT, () => console.log(`🎬 Butaca API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
