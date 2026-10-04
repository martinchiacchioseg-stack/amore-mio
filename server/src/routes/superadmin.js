import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/superadmin/health (System status & technical diagnostics for Roldfy Studio)
router.get('/health', authenticateToken, requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const usersCount = (await client.execute('SELECT COUNT(*) as count FROM users')).rows[0].count;
    const productsCount = (await client.execute('SELECT COUNT(*) as count FROM products')).rows[0].count;
    const salesCount = (await client.execute('SELECT COUNT(*) as count FROM sales')).rows[0].count;
    const customersCount = (await client.execute('SELECT COUNT(*) as count FROM customers')).rows[0].count;
    const movementsCount = (await client.execute('SELECT COUNT(*) as count FROM cash_movements')).rows[0].count;

    return res.json({
      producer: {
        studio: 'RolΦ Studio',
        developer: 'Soporte Técnico RolΦ',
        contact: 'soporte@rolphi.com',
        version: '1.0.0-PROD'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'ONLINE',
        tables: {
          users: Number(usersCount),
          products: Number(productsCount),
          sales: Number(salesCount),
          customers: Number(customersCount),
          cash_movements: Number(movementsCount)
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener diagnóstico del sistema.' });
  }
});

export default router;
