import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateCustomerCreditPDF } from '../services/pdfService.js';

const router = express.Router();

// GET /api/customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, debtorOnly } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const args = [];

    if (debtorOnly === 'true') {
      sql += ' AND credit_balance > 0';
    }

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name ASC';

    const result = await client.execute({ sql, args });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const custRes = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const movementsRes = await client.execute({
      sql: 'SELECT * FROM credit_movements WHERE customer_id = ? ORDER BY created_at DESC',
      args: [id]
    });

    return res.json({
      customer: custRes.rows[0],
      movements: movementsRes.rows
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener detalle del cliente.' });
  }
});

// GET /api/customers/alerts/overdue (Alerts of overdue / pending credit accounts)
router.get('/alerts/overdue', authenticateToken, async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT m.*, c.name as customer_name, c.phone as customer_phone
      FROM credit_movements m
      JOIN customers c ON m.customer_id = c.id
      WHERE m.status IN ('PENDING', 'OVERDUE')
        AND m.due_date IS NOT NULL
        AND date(m.due_date) <= date('now', '+3 days')
      ORDER BY m.due_date ASC
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener alertas de cuentas corrientes.' });
  }
});

// POST /api/customers (Create customer)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, credit_limit, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nombre y WhatsApp son obligatorios.' });
    }

    await client.execute({
      sql: `INSERT INTO customers (name, phone, email, address, credit_limit, notes)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        name.trim(),
        phone.trim(),
        email ? email.trim() : '',
        address ? address.trim() : '',
        Number(credit_limit) || 50000.0,
        notes || ''
      ]
    });

    return res.status(201).json({ message: 'Cliente registrado exitosamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar cliente.' });
  }
});

// POST /api/customers/:id/payment (Record a payment for customer credit account)
router.post('/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, notes } = req.body;
    const paymentAmount = Number(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'El monto ingresado es inválido.' });
    }

    const custRes = await client.execute({ sql: 'SELECT credit_balance FROM customers WHERE id = ?', args: [id] });
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    // 1. Record credit movement (type: CREDIT -> lowers debt)
    await client.execute({
      sql: `INSERT INTO credit_movements (customer_id, type, amount, status, notes)
            VALUES (?, 'CREDIT', ?, 'PAID', ?)`,
      args: [id, paymentAmount, notes || `Pago recibido (${payment_method || 'Efectivo'})`]
    });

    // 2. Update customer credit_balance
    await client.execute({
      sql: 'UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?',
      args: [paymentAmount, id]
    });

    // 3. Register cash movement (Income)
    await client.execute({
      sql: `INSERT INTO cash_movements (seller_id, type, amount, payment_method, category, description)
            VALUES (?, 'INCOME', ?, ?, 'CREDIT_PAYMENT', ?)`,
      args: [req.user.id, paymentAmount, payment_method || 'CASH', `Cobro de Cta. Cte. Cliente ID #${id}`]
    });

    return res.json({ message: 'Pago registrado con éxito y saldo actualizado.' });
  } catch (err) {
    console.error('Error recording credit payment:', err);
    return res.status(500).json({ error: 'Error al registrar el pago de la cuenta corriente.' });
  }
});

// GET /api/customers/:id/pdf (Download PDF report for customer credit account)
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const custRes = await client.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [id] });
    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const customer = custRes.rows[0];
    const movementsRes = await client.execute({
      sql: 'SELECT * FROM credit_movements WHERE customer_id = ? ORDER BY created_at ASC',
      args: [id]
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CuentaCorriente_${customer.name.replace(/\s+/g, '_')}.pdf`);

    generateCustomerCreditPDF(customer, movementsRes.rows, res);
  } catch (err) {
    console.error('Error generating Customer PDF:', err);
    return res.status(500).json({ error: 'Error al generar PDF de la cuenta corriente.' });
  }
});

export default router;
