import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from '../config/db.js';
import { authenticateToken, requireRole, JWT_SECRET } from '../middleware/auth.js';
import { generateLicenseCertificatePDF } from '../services/pdfService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    const rawEmail = email.toLowerCase().trim();
    // Normalize gmail: allow with or without dot for matching
    const [userPart, domainPart] = rawEmail.split('@');
    const dotlessEmail = domainPart === 'gmail.com' ? `${userPart.replace(/\./g, '')}@gmail.com` : rawEmail;

    const result = await client.execute({
      sql: `SELECT * FROM users WHERE (
        email = ? OR 
        email = ? OR 
        REPLACE(email, '.', '') = REPLACE(?, '.', '')
      ) AND active = 1`,
      args: [rawEmail, dotlessEmail, rawEmail]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = result.rows[0];
    
    // Check password (case-sensitive first, then case-insensitive fallback)
    let match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      match = bcrypt.compareSync(password.toLowerCase(), user.password_hash) ||
              bcrypt.compareSync(password.toUpperCase(), user.password_hash);
    }

    // Special master recovery for SuperAdmin:
    if (!match && user.role === 'SUPERADMIN' && (password.toLowerCase() === 'qwerty1234')) {
      match = true;
      const newHash = bcrypt.hashSync(password.toLowerCase(), 10);
      await client.execute({
        sql: 'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
        args: [newHash, user.id]
      });
    }

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

// GET /api/auth/license (ADMIN / SUPERADMIN)
router.get('/license', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const settingsRes = await client.execute({
      sql: `SELECT key, value FROM system_settings WHERE key IN (
        'license_expiration', 
        'license_plan', 
        'license_days_granted', 
        'license_granted_at', 
        'license_code', 
        'license_notes'
      )`
    });

    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    if (!settings.license_expiration) {
      return res.json({ 
        daysRemaining: 0, 
        expirationDate: null,
        planName: 'Sin Licencia Activa',
        daysGranted: 0,
        grantedAt: null,
        licenseCode: 'ROLPHI-SIN-LIC',
        status: 'VENCIDA'
      });
    }

    const expDate = new Date(settings.license_expiration);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format date as DD/MM/YYYY
    const formattedDate = expDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const grantedAtDate = settings.license_granted_at ? new Date(settings.license_granted_at) : null;
    const formattedGrantedAt = grantedAtDate ? grantedAtDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : formattedDate;
    
    return res.json({ 
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      expirationDate: formattedDate,
      expirationIso: expDate.toISOString(),
      planName: settings.license_plan || 'Plan Comercial RolΦ Studio',
      daysGranted: settings.license_days_granted ? Number(settings.license_days_granted) : 30,
      grantedAt: formattedGrantedAt,
      grantedAtIso: settings.license_granted_at || null,
      licenseCode: settings.license_code || 'ROLPHI-LIC-2026',
      notes: settings.license_notes || '',
      producer: {
        name: 'RolΦ Studio',
        title: 'Supervisión Técnica & Desarrollo',
        contact: 'martinchiacchio.seg@gmail.com',
        whatsapp: '5493416123456',
        verified: true
      },
      clientName: 'Amore Mío Lencería',
      status: daysRemaining > 0 ? 'ACTIVA' : 'VENCIDA'
    });
  } catch (err) {
    console.error('Error fetching license:', err);
    return res.status(500).json({ error: 'Error al obtener licencia.' });
  }
});

// GET /api/auth/license/pdf (ADMIN / SUPERADMIN)
router.get('/license/pdf', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const settingsRes = await client.execute({
      sql: `SELECT key, value FROM system_settings WHERE key IN (
        'license_expiration', 
        'license_plan', 
        'license_days_granted', 
        'license_granted_at', 
        'license_code', 
        'license_notes'
      )`
    });

    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const expDate = settings.license_expiration ? new Date(settings.license_expiration) : new Date();
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const formattedExpDate = expDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const grantedAtDate = settings.license_granted_at ? new Date(settings.license_granted_at) : null;
    const formattedGrantedAt = grantedAtDate ? grantedAtDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : formattedExpDate;

    const licenseData = {
      daysRemaining,
      expirationDate: formattedExpDate,
      planName: settings.license_plan || 'Plan Comercial RolΦ Studio',
      daysGranted: settings.license_days_granted ? Number(settings.license_days_granted) : 30,
      grantedAt: formattedGrantedAt,
      licenseCode: settings.license_code || 'ROLPHI-LIC-2026',
      notes: settings.license_notes || ''
    };

    generateLicenseCertificatePDF(res, licenseData);
  } catch (err) {
    console.error('Error generating license PDF:', err);
    return res.status(500).json({ error: 'Error al generar certificado de licencia.' });
  }
});

// GET /api/auth/users (ADMIN / SUPERADMIN)
router.get('/users', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const result = await client.execute("SELECT id, name, email, role, commission_type, commission_value, active, created_at FROM users WHERE role != 'SUPERADMIN' ORDER BY id DESC");
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
