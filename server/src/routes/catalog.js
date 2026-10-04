import express from 'express';
import { client } from '../config/db.js';
import { generateCatalogPDF } from '../services/pdfService.js';

const router = express.Router();

// GET /api/catalog (Public published products)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT p.id, p.code, p.name, p.description, p.sale_price, p.stock, p.image_url, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1
    `;
    const args = [];

    if (category) {
      sql += ` AND p.category_id = ?`;
      args.push(category);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY c.name ASC, p.name ASC`;

    const result = await client.execute({ sql, args });
    
    // Add WhatsApp preformatted message link for each product
    const whatsappPhone = process.env.WHATSAPP_NUMBER || '5493416123456';
    const products = result.rows.map(p => {
      const text = encodeURIComponent(`¡Hola Amore Mío! Quería consultar por el producto "${p.name}" (Código: ${p.code}) de $${p.sale_price.toLocaleString('es-AR')}.`);
      return {
        ...p,
        is_available: p.stock > 0,
        whatsapp_link: `https://wa.me/${whatsappPhone}?text=${text}`
      };
    });

    return res.json(products);
  } catch (err) {
    console.error('Error fetching public catalog:', err);
    return res.status(500).json({ error: 'Error al cargar el catálogo público.' });
  }
});

// GET /api/catalog/pdf (Download catalog PDF)
router.get('/pdf', async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1
      ORDER BY c.name ASC, p.name ASC
    `);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Catalogo-AmoreMio.pdf');

    generateCatalogPDF(result.rows, res);
  } catch (err) {
    console.error('Error generating PDF catalog:', err);
    return res.status(500).json({ error: 'Error al generar el PDF del catálogo.' });
  }
});

export default router;
