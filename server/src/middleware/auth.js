import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'amoremio_secret_key_2026_roldfy';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    
    // Check license after auth
    return checkLicense(req, res, () => {
      next();
    });
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta acción.' });
    }
    next();
  };
}

import { client } from '../config/db.js';

let cachedLicense = null;
let lastLicenseCheck = 0;

export async function checkLicense(req, res, next) {
  // SuperAdmin is immune to license lock
  if (req.user && req.user.role === 'SUPERADMIN') return next();

  try {
    const now = Date.now();
    if (!cachedLicense || (now - lastLicenseCheck > 60000)) {
      const dbRes = await client.execute({ sql: 'SELECT value FROM system_settings WHERE key = ?', args: ['license_expiration'] });
      if (dbRes.rows.length > 0) {
        cachedLicense = new Date(dbRes.rows[0].value);
      }
      lastLicenseCheck = now;
    }

    if (cachedLicense && new Date() > cachedLicense) {
      return res.status(402).json({ 
        error: 'LICENCIA_EXPIRADA', 
        message: 'La licencia del sistema ha expirado. Por favor, comunícate con RolΦ Studio para renovarla.'
      });
    }
    next();
  } catch (err) {
    next(); // on db error, just pass
  }
}
