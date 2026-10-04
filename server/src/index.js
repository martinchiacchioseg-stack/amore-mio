import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDb } from './config/db.js';

import authRouter from './routes/auth.js';
import suppliersRouter from './routes/suppliers.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import catalogRouter from './routes/catalog.js';
import customersRouter from './routes/customers.js';
import salesRouter from './routes/sales.js';
import cashRouter from './routes/cash.js';
import reportsRouter from './routes/reports.js';
import superadminRouter from './routes/superadmin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads & assets
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Static client build if available
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Inicializa la base de datos una sola vez (necesario en Vercel serverless,
// donde no hay un "arranque" tradicional del servidor).
let dbReady = null;
export function ensureDb() {
  if (!dbReady) {
    dbReady = initDb().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

app.use('/api', async (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos.', detail: err.message });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/cash', cashRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/superadmin', superadminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', app: 'Amore Mío API', producer: 'RolΦ Studio' });
});

// Fallback for SPA routing if client dist exists
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Initialize database schema and start server (solo local; en Vercel se exporta la app)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🌸 Servidor Amore Mío corriendo exitosamente en el puerto ${PORT}`);
        console.log(`✨ Desarrollado por RolΦ Studio`);
      });
    })
    .catch((err) => {
      console.error('Error al inicializar la base de datos:', err);
    });
}

export default app;
