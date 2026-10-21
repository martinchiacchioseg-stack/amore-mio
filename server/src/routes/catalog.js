import express from 'express';
import { client } from '../config/db.js';
import { generateCatalogPDF } from '../services/pdfService.js';

const router = express.Router();

// GET /api/catalog (Public published products)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    // Fetch dynamic catalog WhatsApp number
    let whatsappPhone = process.env.WHATSAPP_NUMBER || '5493416123456';
    try {
      const waRes = await client.execute({
        sql: 'SELECT value FROM system_settings WHERE key = ?',
        args: ['catalog_whatsapp']
      });
      if (waRes.rows.length > 0 && waRes.rows[0].value) {
        whatsappPhone = waRes.rows[0].value.replace(/[^\d+]/g, '');
      }
    } catch (e) {
      console.warn('Error reading catalog_whatsapp:', e.message);
    }

    let sql = `
      SELECT p.id, p.code, p.name, p.description, p.sale_price, p.stock, p.image_url, p.images, p.sizes, c.name as category_name
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
      sql += ` AND (p.name LIKE ? OR p.code LIKE ? OR p.description LIKE ? OR p.sizes LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY c.name ASC, p.name ASC`;

    const result = await client.execute({ sql, args });
    
    // Add WhatsApp preformatted message link and parsed images for each product
    const products = result.rows.map(p => {
      let parsedImages = [];
      if (p.images) {
        try {
          parsedImages = JSON.parse(p.images);
        } catch (e) {
          parsedImages = [];
        }
      }
      if (!Array.isArray(parsedImages) || parsedImages.length === 0) {
        if (p.image_url) {
          parsedImages = [p.image_url];
        }
      }

      const text = encodeURIComponent(`¡Hola Amore Mío! Quería consultar por el producto "${p.name}" (Código: ${p.code}) de $${p.sale_price.toLocaleString('es-AR')}.`);
      return {
        ...p,
        images: parsedImages,
        is_available: p.stock > 0,
        whatsapp_phone: whatsappPhone,
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
