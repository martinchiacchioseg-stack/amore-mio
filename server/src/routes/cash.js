import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateSellerSettlementPDF } from '../services/pdfService.js';

const router = express.Router();

// GET /api/cash/summary (Current Cash Register Summary)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filterClause = '';
    const args = [];

    if (startDate && endDate) {
      filterClause = "WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)";
      args.push(startDate, endDate);
    } else {
      filterClause = "WHERE date(created_at) = date('now')";
    }

    // 1. Total Income by payment method
    const cashIncomeRes = await client.execute({
      sql: `SELECT payment_method, SUM(amount) as total FROM cash_movements ${filterClause} AND type = 'INCOME' GROUP BY payment_method`,
      args
    });

    const cashExpensesRes = await client.execute({
      sql: `SELECT payment_method, SUM(amount) as total FROM cash_movements ${filterClause} AND type = 'EXPENSE' GROUP BY payment_method`,
      args
    });

    // 2. Sales Breakdown (Replacement Cost, Seller Commissions, Net Profit)
    let salesFilterClause = filterClause ? filterClause : "WHERE date(created_at) = date('now')";
    const breakdownRes = await client.execute({
      sql: `SELECT 
              SUM(total) as total_sales,
              SUM(seller_commission) as total_commissions,
              SUM(replacement_cost) as total_replacement_cost,
              SUM(net_profit) as total_net_profit
            FROM sales ${salesFilterClause} AND status = 'COMPLETED'`,
      args
    });

    const incomeByMethod = { CASH: 0, TRANSFER: 0, QR: 0 };
    cashIncomeRes.rows.forEach(r => {
      if (incomeByMethod[r.payment_method] !== undefined) {
        incomeByMethod[r.payment_method] = Number(r.total);
      }
    });

    const expensesByMethod = { CASH: 0, TRANSFER: 0, QR: 0 };
    cashExpensesRes.rows.forEach(r => {
      if (expensesByMethod[r.payment_method] !== undefined) {
        expensesByMethod[r.payment_method] = Number(r.total);
      }
    });

    const breakdown = breakdownRes.rows[0] || {};

    return res.json({
      incomeByMethod,
      expensesByMethod,
      totalIncome: Object.values(incomeByMethod).reduce((a, b) => a + b, 0),
      totalExpenses: Object.values(expensesByMethod).reduce((a, b) => a + b, 0),
      salesBreakdown: {
        totalSales: Number(breakdown.total_sales) || 0,
        totalCommissions: Number(breakdown.total_commissions) || 0,
        totalReplacementCost: Number(breakdown.total_replacement_cost) || 0,
        totalNetProfit: Number(breakdown.total_net_profit) || 0
      }
    });
  } catch (err) {
    console.error('Error fetching cash summary:', err);
    return res.status(500).json({ error: 'Error al obtener resumen de caja.' });
  }
});

// GET /api/cash/movements
router.get('/movements', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let sql = `
      SELECT cm.*, u.name as seller_name
      FROM cash_movements cm
      LEFT JOIN users u ON cm.seller_id = u.id
      WHERE 1=1
    `;
    const args = [];

    if (startDate) {
      sql += ' AND date(cm.created_at) >= date(?)';
      args.push(startDate);
    }
    if (endDate) {
      sql += ' AND date(cm.created_at) <= date(?)';
      args.push(endDate);
    }

    sql += ' ORDER BY cm.id DESC LIMIT 100';

    const result = await client.execute({ sql, args });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener movimientos de caja.' });
  }
});

// POST /api/cash/movements (Manual Income/Expense)
router.post('/movements', authenticateToken, requireRole('ADMIN', 'MANAGER', 'SELLER', 'SUPERADMIN'), async (req, res) => {
  try {
    const { type, amount, payment_method, category, description } = req.body;
    if (!type || !amount || !description) {
      return res.status(400).json({ error: 'Tipo, monto y descripción son requeridos.' });
    }

    await client.execute({
      sql: `INSERT INTO cash_movements (seller_id, type, amount, payment_method, category, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        req.user.id,
        type,
        Number(amount),
        payment_method || 'CASH',
        category || 'MANUAL',
        description.trim()
      ]
    });

    return res.status(201).json({ message: 'Movimiento de caja registrado exitosamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar movimiento de caja.' });
  }
});

// GET /api/cash/settlement/seller/:sellerId/pdf (Seller Settlement PDF Download)
router.get('/settlement/seller/:sellerId/pdf', authenticateToken, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate } = req.query;

    const sellerRes = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [sellerId] });
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado.' });
    }
    const seller = sellerRes.rows[0];

    let sql = `
      SELECT s.*, c.name as customer_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.seller_id = ? AND s.status = 'COMPLETED'
    `;
    const args = [sellerId];

    if (startDate) {
      sql += ' AND date(s.created_at) >= date(?)';
      args.push(startDate);
    }
    if (endDate) {
      sql += ' AND date(s.created_at) <= date(?)';
      args.push(endDate);
    }

    sql += ' ORDER BY s.created_at ASC';

    const salesRes = await client.execute({ sql, args });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Rendicion_Vendedor_${seller.name.replace(/\s+/g, '_')}.pdf`);

    generateSellerSettlementPDF(seller, salesRes.rows, res);
  } catch (err) {
    console.error('Error generating Seller Settlement PDF:', err);
    return res.status(500).json({ error: 'Error al generar el informe de rendición del vendedor.' });
  }
});

// GET /api/cash/sellers-balance
router.get('/sellers-balance', authenticateToken, requireRole('ADMIN', 'SUPERADMIN', 'MANAGER'), async (req, res) => {
  try {
    // For each seller: Sum of commissions earned minus sum of COMMISSION_PAYMENT expenses
    const sql = `
      SELECT u.id, u.name,
             COALESCE((SELECT SUM(seller_commission) FROM sales WHERE seller_id = u.id AND status = 'COMPLETED'), 0) as total_earned,
             COALESCE((SELECT SUM(amount) FROM cash_movements WHERE seller_id = u.id AND category = 'COMMISSION_PAYMENT'), 0) as total_paid
      FROM users u
      WHERE u.role IN ('SELLER', 'ADMIN')
    `;
    const dbRes = await client.execute(sql);
    const balances = dbRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      total_earned: Number(r.total_earned),
      total_paid: Number(r.total_paid),
      balance: Number(r.total_earned) - Number(r.total_paid)
    }));
    return res.json(balances);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener saldos de vendedores.' });
  }
});

// POST /api/cash/pay-commission
router.post('/pay-commission', authenticateToken, requireRole('ADMIN', 'SUPERADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { seller_id, amount, payment_method, notes } = req.body;
    if (!seller_id || !amount || amount <= 0 || !payment_method) {
      return res.status(400).json({ error: 'Datos de pago incompletos o inválidos.' });
    }

    await client.execute({
      sql: `INSERT INTO cash_movements (seller_id, type, amount, payment_method, category, description)
            VALUES (?, 'EXPENSE', ?, ?, 'COMMISSION_PAYMENT', ?)`,
      args: [seller_id, amount, payment_method, `Pago de comisiones acumuladas. Notas: ${notes || ''}`]
    });

    return res.json({ success: true, message: 'Pago de comisión registrado exitosamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar el pago de comisión.' });
  }
});

export default router;
