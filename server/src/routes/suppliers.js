import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await client.execute('SELECT * FROM suppliers ORDER BY name ASC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener proveedores.' });
  }
});

// POST /api/suppliers
router.post('/', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'El nombre del proveedor es obligatorio.' });
    }

    await client.execute({
      sql: 'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      args: [name, contact_person || '', phone || '', email || '', address || '']
    });

    return res.status(201).json({ message: 'Proveedor creado exitosamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar proveedor.' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

    await client.execute({
      sql: 'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      args: [name, contact_person || '', phone || '', email || '', address || '', id]
    });

    return res.json({ message: 'Proveedor actualizado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar proveedor.' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await client.execute({ sql: 'DELETE FROM suppliers WHERE id = ?', args: [id] });
    return res.json({ message: 'Proveedor eliminado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar proveedor.' });
  }
});

export default router;
