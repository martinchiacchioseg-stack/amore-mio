import express from 'express';
import { client } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sales
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, sellerId, paymentMethod } = req.query;
    let sql = `
      SELECT s.*, u.name as seller_name, c.name as customer_name
      FROM sales s
      JOIN users u ON s.seller_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    const args = [];

    if (sellerId) {
      sql += ' AND s.seller_id = ?';
      args.push(sellerId);
    }

    if (paymentMethod) {
      sql += ' AND s.payment_method = ?';
      args.push(paymentMethod);
    }

    if (startDate) {
      sql += ' AND date(s.created_at) >= date(?)';
      args.push(startDate);
    }

    if (endDate) {
      sql += ' AND date(s.created_at) <= date(?)';
      args.push(endDate);
    }

    sql += ' ORDER BY s.id DESC';

    const result = await client.execute({ sql, args });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener listado de ventas.' });
  }
});

// GET /api/sales/:id (Sale detail with items)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const saleRes = await client.execute({
      sql: `SELECT s.*, u.name as seller_name, c.name as customer_name, c.phone as customer_phone
            FROM sales s
            JOIN users u ON s.seller_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?`,
      args: [id]
    });

    if (saleRes.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada.' });
    }

    const itemsRes = await client.execute({
      sql: `SELECT si.*, p.name as product_name, p.code as product_code
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?`,
      args: [id]
    });

    return res.json({
      sale: saleRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener detalle de la venta.' });
  }
});

// POST /api/sales (Register new Sale)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, items, payment_type, payment_method, discount, due_days } = req.body;
    const seller_id = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debes incluir al menos un producto en la venta.' });
    }

    if (!payment_type || !['CASH_ON_HAND', 'CREDIT_ACCOUNT'].includes(payment_type)) {
      return res.status(400).json({ error: 'Modalidad de pago inválida (contado o cuenta corriente).' });
    }

    if (payment_type === 'CREDIT_ACCOUNT' && !customer_id) {
      return res.status(400).json({ error: 'Para ventas a cuenta corriente es obligatorio seleccionar un cliente.' });
    }

    // 1. Fetch seller info to calculate commission
    const sellerRes = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [seller_id] });
    const seller = sellerRes.rows[0];

    // 2. Validate stock and calculate cost and total price
    let subtotal = 0;
    let totalReplacementCost = 0;
    const processedItems = [];

    for (const item of items) {
      const prodRes = await client.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.product_id] });
      if (prodRes.rows.length === 0) {
        return res.status(400).json({ error: `El producto ID #${item.product_id} no existe.` });
      }

      const prod = prodRes.rows[0];
      const qty = Number(item.quantity) || 1;

      if (prod.stock < qty) {
        return res.status(400).json({ error: `Stock insuficiente para "${prod.name}". Stock disponible: ${prod.stock}, solicitado: ${qty}.` });
      }

      const unitSalePrice = item.unit_sale_price ? Number(item.unit_sale_price) : Number(prod.sale_price);
      const unitCostPrice = Number(prod.cost_price);
      const itemSubtotal = unitSalePrice * qty;

      subtotal += itemSubtotal;
      totalReplacementCost += unitCostPrice * qty;

      processedItems.push({
        product_id: prod.id,
        quantity: qty,
        unit_cost_price: unitCostPrice,
        unit_sale_price: unitSalePrice,
        subtotal: itemSubtotal
      });
    }

    const discountAmount = Number(discount) || 0.0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    // 3. Calculate Seller Commission
    let sellerCommission = 0.0;
    if (seller) {
      if (seller.commission_type === 'PERCENTAGE') {
        sellerCommission = (finalTotal * Number(seller.commission_value)) / 100;
      } else {
        sellerCommission = Number(seller.commission_value);
      }
    }

    // 4. Calculate Net Profit (Total - Replacement Cost - Seller Commission)
    const netProfit = finalTotal - totalReplacementCost - sellerCommission;

    // 5. Generate Sale Number
    const saleCountRes = await client.execute('SELECT COUNT(*) as count FROM sales');
    const nextNum = Number(saleCountRes.rows[0].count) + 1;
    const saleNumber = `VENTA-${String(nextNum).padStart(6, '0')}`;

    // 6. Insert Sale Record
    const insertSaleRes = await client.execute({
      sql: `INSERT INTO sales (
              sale_number, customer_id, seller_id, payment_type, payment_method,
              subtotal, discount, total, seller_commission, replacement_cost, net_profit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        saleNumber,
        customer_id ? Number(customer_id) : null,
        seller_id,
        payment_type,
        payment_type === 'CREDIT_ACCOUNT' ? 'CREDIT_ACCOUNT' : (payment_method || 'CASH'),
        subtotal,
        discountAmount,
        finalTotal,
        sellerCommission,
        totalReplacementCost,
        netProfit
      ]
    });

    const saleId = Number(insertSaleRes.lastInsertRowid);

    // 7. Insert Sale Items & Update Product Stock
    for (const pItem of processedItems) {
      await client.execute({
        sql: `INSERT INTO sale_items (sale_id, product_id, quantity, unit_cost_price, unit_sale_price, subtotal)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [saleId, pItem.product_id, pItem.quantity, pItem.unit_cost_price, pItem.unit_sale_price, pItem.subtotal]
      });

      await client.execute({
        sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
        args: [pItem.quantity, pItem.product_id]
      });
    }

    // 8. Handle Payment Type Impact (CASH_ON_HAND vs CREDIT_ACCOUNT)
    if (payment_type === 'CASH_ON_HAND') {
      // Record income in cash movements
      await client.execute({
        sql: `INSERT INTO cash_movements (sale_id, seller_id, type, amount, payment_method, category, description)
              VALUES (?, ?, 'INCOME', ?, ?, 'SALE', ?)`,
        args: [
          saleId,
          seller_id,
          finalTotal,
          payment_method || 'CASH',
          `Venta registrada #${saleNumber}`
        ]
      });
    } else if (payment_type === 'CREDIT_ACCOUNT') {
      // Update customer credit balance and add credit movement
      const days = Number(due_days) || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await client.execute({
        sql: `INSERT INTO credit_movements (customer_id, sale_id, type, amount, due_date, status, notes)
              VALUES (?, ?, 'DEBIT', ?, ?, 'PENDING', ?)`,
        args: [
          customer_id,
          saleId,
          finalTotal,
          dueDateStr,
          `Venta #${saleNumber} a Cuenta Corriente (${days} días)`
        ]
      });

      await client.execute({
        sql: 'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?',
        args: [finalTotal, customer_id]
      });
    }

    return res.status(201).json({
      message: 'Venta efectuada con éxito.',
      sale: {
        id: saleId,
        sale_number: saleNumber,
        total: finalTotal,
        seller_commission: sellerCommission,
        replacement_cost: totalReplacementCost,
        net_profit: netProfit
      }
    });
  } catch (err) {
    console.error('Error processing sale:', err);
    return res.status(500).json({ error: 'Error al procesar la venta.' });
  }
});

export default router;
