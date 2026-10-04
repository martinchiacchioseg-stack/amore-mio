import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from '../config/db.js';
import { authenticateToken, requireRole, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const result = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ? AND active = 1',
      args: [email.toLowerCase().trim()]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];
    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        must_change_password: user.must_change_password
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        commission_type: user.commission_type,
        commission_value: user.commission_value,
        must_change_password: user.must_change_password
      }
    });
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const userRes = await client.execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [req.user.id]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = userRes.rows[0];
    if (user.must_change_password === 0) {
      const match = bcrypt.compareSync(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await client.execute({
      sql: 'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      args: [newHash, req.user.id]
    });

    return res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
});

// GET /api/auth/users (ADMIN / SUPERADMIN)
router.get('/users', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const result = await client.execute('SELECT id, name, email, role, commission_type, commission_value, active, created_at FROM users ORDER BY id DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// POST /api/auth/users (ADMIN / SUPERADMIN create user)
router.post('/users', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, commission_type, commission_value } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios.' });
    }

    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()]
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    const passHash = bcrypt.hashSync(password, 10);
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, commission_type, commission_value, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: [
        name,
        email.toLowerCase().trim(),
        passHash,
        role,
        commission_type || 'PERCENTAGE',
        Number(commission_value) || 0.0
      ]
    });

    return res.status(201).json({ message: 'Usuario creado exitosamente.' });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Error al crear usuario.' });
  }
});

// PUT /api/auth/users/:id (Edit user / commission)
router.put('/users/:id', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, commission_type, commission_value, active } = req.body;

    await client.execute({
      sql: `UPDATE users 
            SET name = ?, role = ?, commission_type = ?, commission_value = ?, active = ?
            WHERE id = ?`,
      args: [
        name,
        role,
        commission_type || 'PERCENTAGE',
        Number(commission_value) || 0.0,
        active !== undefined ? Number(active) : 1,
        id
      ]
    });

    return res.json({ message: 'Usuario actualizado correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
});

export default router;
