// Punto de entrada del backend de Butaca
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Ruta de comprobación: sirve para saber si el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Butaca API', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎬 Butaca API escuchando en http://localhost:${PORT}`);
});
