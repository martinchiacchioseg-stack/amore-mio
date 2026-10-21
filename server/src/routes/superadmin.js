import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateLicenseCertificatePDF } from '../services/pdfService.js';

const router = express.Router();

// GET /api/superadmin/health (System status & technical diagnostics for Roldfy Studio)
router.get('/health', authenticateToken, requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const usersCount = (await client.execute('SELECT COUNT(*) as count FROM users')).rows[0].count;
    const productsCount = (await client.execute('SELECT COUNT(*) as count FROM products')).rows[0].count;
    const salesCount = (await client.execute('SELECT COUNT(*) as count FROM sales')).rows[0].count;
    const customersCount = (await client.execute('SELECT COUNT(*) as count FROM customers')).rows[0].count;
    const movementsCount = (await client.execute('SELECT COUNT(*) as count FROM cash_movements')).rows[0].count;
    
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

    const licenseExpiration = settings.license_expiration || null;
    let daysRemaining = 0;
    let formattedExpDate = null;
    if (licenseExpiration) {
      const expDate = new Date(licenseExpiration);
      const diffTime = expDate.getTime() - new Date().getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      formattedExpDate = expDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    return res.json({
      producer: {
        studio: 'RolΦ Studio',
        developer: 'Soporte Técnico RolΦ',
        contact: 'martinchiacchio.seg@gmail.com',
        version: '1.0.0-PROD',
        licenseExpiration,
        daysRemaining,
        expirationDate: formattedExpDate,
        planName: settings.license_plan || 'Plan Comercial RolΦ Studio',
        daysGranted: settings.license_days_granted ? Number(settings.license_days_granted) : 30,
        grantedAt: settings.license_granted_at ? new Date(settings.license_granted_at).toLocaleDateString('es-AR') : null,
        licenseCode: settings.license_code || 'ROLPHI-LIC-2026',
        notes: settings.license_notes || ''
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

// POST /api/superadmin/diagnostics/run
router.post('/diagnostics/run', authenticateToken, requireRole('SUPERADMIN'), async (req, res) => {
  const logs = [];
  const log = (msg) => logs.push(`[${new Date().toISOString().substring(11, 19)}] ${msg}`);
  
  try {
    log('Iniciando prueba de diagnóstico E2E integral...');
    
    // 1. Create temporary category
    log('Creando categoría de prueba (Categoría Test)...');
    const catRes = await client.execute({
      sql: 'INSERT INTO categories (name) VALUES (?) RETURNING id',
      args: ['Categoría Test E2E']
    });
    const catId = catRes.rows[0].id;

    // 2. Create temporary product
    log('Creando producto de prueba (ART-TEST-E2E)...');
    const prodRes = await client.execute({
      sql: `INSERT INTO products (code, name, category_id, cost_price, sale_price, stock, is_published) 
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: ['ART-TEST-E2E', 'Producto Test E2E', catId, 100, 200, 10, 1]
    });
    const prodId = prodRes.rows[0].id;

    // 3. Create temporary customer
    log('Creando cliente de prueba (Cliente Test E2E)...');
    const cusRes = await client.execute({
      sql: 'INSERT INTO customers (name, phone) VALUES (?, ?) RETURNING id',
      args: ['Cliente Test E2E', '123456789']
    });
    const cusId = cusRes.rows[0].id;

    // 4. Create sale (simulating POS)
    log('Simulando venta en Punto de Venta...');
    // We insert sale manually similar to POS backend
    const saleNum = 'VENTA-TEST-E2E';
    const saleInsert = await client.execute({
      sql: `INSERT INTO sales (sale_number, seller_id, customer_id, total, payment_method, replacement_cost, seller_commission, net_profit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [saleNum, req.user.id, cusId, 400, 'CASH', 200, 40, 160] // selling 2 units
    });
    const saleId = saleInsert.rows[0].id;

    await client.execute({
      sql: 'INSERT INTO sale_items (sale_id, product_id, quantity, unit_cost_price, unit_sale_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
      args: [saleId, prodId, 2, 100, 200, 400]
    });

    await client.execute({
      sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
      args: [2, prodId]
    });

    await client.execute({
      sql: 'INSERT INTO cash_movements (seller_id, sale_id, type, amount, payment_method, category, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.id, saleId, 'INCOME', 400, 'CASH', 'SALE', 'Venta E2E Test']
    });

    // 5. Verify integrity
    log('Verificando integridad de los datos en base de datos...');
    const verifyProd = await client.execute({ sql: 'SELECT stock FROM products WHERE id = ?', args: [prodId] });
    if (verifyProd.rows[0].stock !== 8) throw new Error('Stock no descontado correctamente.');

    const verifyCash = await client.execute({ sql: 'SELECT amount FROM cash_movements WHERE sale_id = ?', args: [saleId] });
    if (verifyCash.rows.length === 0 || verifyCash.rows[0].amount !== 400) throw new Error('Movimiento de caja no registrado correctamente.');

    log('Prueba E2E completada con éxito. Eliminando datos temporales...');

    // 6. Cleanup
    await client.execute({ sql: 'DELETE FROM cash_movements WHERE sale_id = ?', args: [saleId] });
    await client.execute({ sql: 'DELETE FROM sale_items WHERE sale_id = ?', args: [saleId] });
    await client.execute({ sql: 'DELETE FROM sales WHERE id = ?', args: [saleId] });
    await client.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [cusId] });
    await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [prodId] });
    await client.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [catId] });

    log('Limpieza completada. No hay inconsistencias en la base de datos.');

    return res.json({ success: true, logs });
  } catch (err) {
    log(`ERROR CRÍTICO: ${err.message}`);
    
    // Attempt cleanup on failure
    log('Intentando rollback de emergencia...');
    try {
      await client.execute({ sql: 'DELETE FROM cash_movements WHERE description = ?', args: ['Venta E2E Test'] });
      await client.execute({ sql: 'DELETE FROM sales WHERE sale_number = ?', args: ['VENTA-TEST-E2E'] });
      await client.execute({ sql: 'DELETE FROM customers WHERE name = ?', args: ['Cliente Test E2E'] });
      await client.execute({ sql: 'DELETE FROM products WHERE code = ?', args: ['ART-TEST-E2E'] });
      await client.execute({ sql: 'DELETE FROM categories WHERE name = ?', args: ['Categoría Test E2E'] });
      log('Rollback exitoso.');
    } catch (e) {
      log('Falló el rollback.');
    }

    return res.status(500).json({ success: false, logs, error: 'Inconsistencia detectada durante la prueba E2E.' });
  }
});

// POST /api/superadmin/license/extend
router.post('/license/extend', authenticateToken, requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const { days, override, planName, notes } = req.body;
    if (!days || isNaN(days)) return res.status(400).json({ error: 'Días inválidos.' });

    const licenseRes = await client.execute({ sql: 'SELECT value FROM system_settings WHERE key = ?', args: ['license_expiration'] });
    let baseDate = new Date();
    if (!override && licenseRes.rows.length > 0 && new Date(licenseRes.rows[0].value) > new Date()) {
      baseDate = new Date(licenseRes.rows[0].value);
    }
    
    // If we're overriding, or if baseDate was today, we just add the days
    baseDate.setDate(baseDate.getDate() + Number(days));
    
    const nowIso = new Date().toISOString();
    const finalPlanName = planName || (Number(days) === 30 ? 'Plan Mensual (30 Días)' : Number(days) === 90 ? 'Plan Trimestral (90 Días)' : Number(days) === 180 ? 'Plan Semestral (180 Días)' : Number(days) === 365 ? 'Plan Anual (365 Días)' : `Plan Especial (${days} Días)`);
    const finalCode = `ROLPHI-AM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const upsertSetting = async (key, val) => {
      await client.execute({
        sql: `INSERT INTO system_settings (key, value) VALUES (?, ?) 
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [key, String(val)]
      });
    };

    await upsertSetting('license_expiration', baseDate.toISOString());
    await upsertSetting('license_plan', finalPlanName);
    await upsertSetting('license_days_granted', String(days));
    await upsertSetting('license_granted_at', nowIso);
    await upsertSetting('license_code', finalCode);
    if (notes !== undefined) {
      await upsertSetting('license_notes', notes);
    }

    const diffTime = baseDate.getTime() - new Date().getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const formattedExpDate = baseDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedGrantedAt = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return res.json({ 
      success: true, 
      newExpiration: baseDate.toISOString(),
      daysRemaining,
      expirationDate: formattedExpDate,
      planName: finalPlanName,
      daysGranted: Number(days),
      grantedAt: formattedGrantedAt,
      licenseCode: finalCode,
      notes: notes || ''
    });
  } catch (err) {
    console.error('Error al extender licencia:', err);
    return res.status(500).json({ error: 'Error al extender licencia.' });
  }
});

// GET /api/superadmin/license/pdf
router.get('/license/pdf', authenticateToken, requireRole('SUPERADMIN'), async (req, res) => {
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
    const diffTime = expDate.getTime() - new Date().getTime();
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
    console.error('Error generating superadmin license PDF:', err);
    return res.status(500).json({ error: 'Error al generar certificado de licencia.' });
  }
});

export default router;
