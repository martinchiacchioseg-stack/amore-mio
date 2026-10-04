import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // 1. Sales today
    const salesTodayRes = await client.execute(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE date(created_at) = date('now') AND status = 'COMPLETED'
    `);

    // 2. Total active customers count
    const customerCountRes = await client.execute('SELECT COUNT(*) as count FROM customers');

    // 3. Pending credit accounts balance sum
    const totalCreditBalanceRes = await client.execute('SELECT COALESCE(SUM(credit_balance), 0) as total FROM customers WHERE credit_balance > 0');

    // 4. Low stock products count
    const lowStockRes = await client.execute('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock_alert');

    // 5. Top 5 selling products
    const topProductsRes = await client.execute(`
      SELECT p.name, p.code, SUM(si.quantity) as total_qty, SUM(si.subtotal) as total_amount
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED'
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // 6. Top 5 purchasing customers
    const topCustomersRes = await client.execute(`
      SELECT c.name, c.phone, COUNT(s.id) as purchases_count, SUM(s.total) as total_spent
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'COMPLETED'
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 5
    `);

    // 7. Last 6 months sales comparison
    const monthlySalesRes = await client.execute(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(total) as total, COUNT(*) as count
      FROM sales
      WHERE status = 'COMPLETED'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `);

    return res.json({
      salesToday: {
        count: Number(salesTodayRes.rows[0].count),
        total: Number(salesTodayRes.rows[0].total)
      },
      customersCount: Number(customerCountRes.rows[0].count),
      totalCreditBalance: Number(totalCreditBalanceRes.rows[0].total),
      lowStockCount: Number(lowStockRes.rows[0].count),
      topProducts: topProductsRes.rows,
      topCustomers: topCustomersRes.rows,
      monthlySales: monthlySalesRes.rows.reverse()
    });
  } catch (err) {
    console.error('Error fetching reports dashboard:', err);
    return res.status(500).json({ error: 'Error al generar los reportes del sistema.' });
  }
});

export default router;
