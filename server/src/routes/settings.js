import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/public (Public settings for the catalog)
router.get('/public', async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT value FROM system_settings WHERE key = ?',
      args: ['catalog_whatsapp']
    });

    const catalogWhatsapp = result.rows.length > 0 ? result.rows[0].value : '5493416123456';
    return res.json({
      catalog_whatsapp: catalogWhatsapp
    });
  } catch (err) {
    console.error('Error fetching public settings:', err);
    return res.status(500).json({ error: 'Error al obtener configuración pública.' });
  }
});

// GET /api/settings (Admin/SuperAdmin)
router.get('/', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const result = await client.execute('SELECT key, value FROM system_settings');
    const settings = {};
    result.rows.forEach(r => {
      settings[r.key] = r.value;
    });

    if (!settings.catalog_whatsapp) {
      settings.catalog_whatsapp = '5493416123456';
    }

    return res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ error: 'Error al obtener configuraciones.' });
  }
});

// PUT /api/settings (Admin/SuperAdmin)
router.put('/', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { catalog_whatsapp } = req.body;

    if (catalog_whatsapp !== undefined) {
      // Clean up phone number: keep numbers or plus
      const cleaned = catalog_whatsapp.replace(/[^\d+]/g, '');
      await client.execute({
        sql: `INSERT INTO system_settings (key, value) VALUES ('catalog_whatsapp', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [cleaned]
      });
    }

    return res.json({ message: 'Configuración actualizada exitosamente.' });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ error: 'Error al actualizar configuración.' });
  }
});

export default router;
