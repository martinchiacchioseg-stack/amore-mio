import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP).'), false);
    }
  }
});

const router = express.Router();

// GET /api/products (All products for admin/staff view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name, s.name as supplier_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const args = [];

    if (category) {
      sql += ` AND p.category_id = ?`;
      args.push(category);
    }

    if (lowStock === 'true') {
      sql += ` AND p.stock <= p.min_stock_alert`;
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.name ASC`;

    const result = await client.execute({ sql, args });
    return res.json(result.rows);
  } catch (err) {
    console.error('Error getting products:', err);
    return res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

// GET /api/products/alerts (Low stock products alert)
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= p.min_stock_alert
      ORDER BY p.stock ASC
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener alertas de stock.' });
  }
});

// POST /api/products (Create product)
router.post('/', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), upload.single('image'), async (req, res) => {
  try {
    const { code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Código y Nombre son requeridos.' });
    }

    const cost = Number(cost_price) || 0.0;
    let finalSalePrice = Number(sale_price) || 0.0;
    const profitPct = Number(profit_percentage) || 0.0;

    // Calculate automatically if profit_percentage provided and sale_price not set manually
    if (profitPct > 0 && cost > 0 && (!sale_price || Number(sale_price) === 0)) {
      finalSalePrice = cost * (1 + profitPct / 100);
    } else if (cost > 0 && finalSalePrice > 0 && profitPct === 0) {
      // Calculate profit percentage
      const calculatedProfit = ((finalSalePrice - cost) / cost) * 100;
      req.body.profit_percentage = calculatedProfit;
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    await client.execute({
      sql: `INSERT INTO products (
              code, name, description, category_id, supplier_id, 
              cost_price, sale_price, profit_percentage, stock, 
              min_stock_alert, image_url, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        code.trim().toUpperCase(),
        name.trim(),
        description || '',
        category_id ? Number(category_id) : null,
        supplier_id ? Number(supplier_id) : null,
        cost,
        finalSalePrice,
        profitPct,
        Number(stock) || 0,
        Number(min_stock_alert) || 5,
        imageUrl,
        is_published === 'true' || is_published === true || is_published === 1 ? 1 : 0
      ]
    });

    return res.status(201).json({ message: 'Producto registrado exitosamente.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'El código de producto ya existe.' });
    }
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Error al registrar producto.' });
  }
});

// PUT /api/products/:id (Update product)
router.put('/:id', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published } = req.body;

    const cost = Number(cost_price) || 0.0;
    let finalSalePrice = Number(sale_price) || 0.0;
    let profitPct = Number(profit_percentage) || 0.0;

    if (profitPct > 0 && cost > 0 && (!sale_price || Number(sale_price) === 0)) {
      finalSalePrice = cost * (1 + profitPct / 100);
    }

    let imageUrl = req.body.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await client.execute({
      sql: `UPDATE products SET
              code = ?, name = ?, description = ?, category_id = ?, supplier_id = ?,
              cost_price = ?, sale_price = ?, profit_percentage = ?, stock = ?,
              min_stock_alert = ?, is_published = ?,
              image_url = COALESCE(?, image_url)
            WHERE id = ?`,
      args: [
        code.trim().toUpperCase(),
        name.trim(),
        description || '',
        category_id ? Number(category_id) : null,
        supplier_id ? Number(supplier_id) : null,
        cost,
        finalSalePrice,
        profitPct,
        Number(stock) || 0,
        Number(min_stock_alert) || 5,
        is_published === 'true' || is_published === true || is_published === 1 ? 1 : 0,
        imageUrl,
        id
      ]
    });

    return res.json({ message: 'Producto actualizado exitosamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

// PATCH /api/products/:id/toggle-published (Toggle public catalog visibility)
router.patch('/:id/toggle-published', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await client.execute(`UPDATE products SET is_published = CASE WHEN is_published = 1 THEN 0 ELSE 1 END WHERE id = ${id}`);
    return res.json({ message: 'Estado de publicación actualizado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al modificar publicación.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
    return res.json({ message: 'Producto eliminado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al borrar producto.' });
  }
});

export default router;
