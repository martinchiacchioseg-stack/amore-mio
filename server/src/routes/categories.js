import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await client.execute('SELECT * FROM categories ORDER BY name ASC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar categorías.' });
  }
});

// POST /api/categories
router.post('/', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
    }

    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: [name.trim(), description || '']
    });

    return res.status(201).json({ message: 'Categoría creada con éxito.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Ya existe una categoría con este nombre.' });
    }
    return res.status(500).json({ error: 'Error al guardar categoría.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await client.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
    return res.json({ message: 'Categoría eliminada.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar categoría.' });
  }
});

export default router;
