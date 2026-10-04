import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { initDb, client } from '../src/config/db.js';

let adminToken = '';
let sellerToken = '';
let testProductId = 0;
let testCustomerId = 0;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();

  // Login as admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'vampyfz1214@gmail.com', password: 'qwerty1234' });

  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.token;

  // Login as seller
  const sellerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'vendedor@amoremio.com', password: 'vendedor123' });

  expect(sellerRes.status).toBe(200);
  sellerToken = sellerRes.body.token;
});

describe('Flujos Críticos - Amore Mío', () => {

  it('1. Creación de Producto y Cálculo Automático de Margen de Ganancia', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'TEST-99',
        name: 'Conjunto Test Encaje',
        cost_price: 5000,
        profit_percentage: 100, // Debe resultar en sale_price = 10000
        stock: 20,
        min_stock_alert: 5,
        is_published: true
      });

    expect(res.status).toBe(201);

    const getRes = await request(app)
      .get('/api/products?search=TEST-99')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBeGreaterThan(0);
    const prod = getRes.body[0];
    expect(prod.sale_price).toBe(10000);
    testProductId = prod.id;
  });

  it('2. Creación de Cliente para Cuenta Corriente', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ana Laura Test',
        phone: '+549341000111',
        email: 'ana.test@gmail.com',
        credit_limit: 50000
      });

    expect(res.status).toBe(201);

    const custsRes = await request(app)
      .get('/api/customers?search=Ana Laura')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(custsRes.body.length).toBeGreaterThan(0);
    testCustomerId = custsRes.body[0].id;
    expect(custsRes.body[0].credit_balance).toBe(0);
  });

  it('3. Flujo Crítico de Venta al Contado: Impacto en Caja, Comisión Vendedor y Stock', async () => {
    // Venta de 2 unidades del producto TEST-99 (costo: 5000 c/u, venta: 10000 c/u)
    // Subtotal: 20000, Costo reposición: 10000, Comisión vendedora (10%): 2000, Ganancia neta: 8000
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        payment_type: 'CASH_ON_HAND',
        payment_method: 'CASH',
        items: [
          { product_id: testProductId, quantity: 2 }
        ]
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body.sale.total).toBe(20000);
    expect(saleRes.body.sale.replacement_cost).toBe(10000);
    expect(saleRes.body.sale.seller_commission).toBe(2000);
    expect(saleRes.body.sale.net_profit).toBe(8000);

    // Verificar reducción de stock de 20 a 18
    const prodRes = await request(app)
      .get('/api/products?search=TEST-99')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(prodRes.body[0].stock).toBe(18);

    // Verificar caja
    const cashRes = await request(app)
      .get('/api/cash/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cashRes.status).toBe(200);
    expect(cashRes.body.incomeByMethod.CASH).toBeGreaterThanOrEqual(20000);
  });

  it('4. Flujo Crítico de Venta a Cuenta Corriente y Cobro de Deuda', async () => {
    // Venta a cuenta corriente de $10000 a Ana Laura Test
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        customer_id: testCustomerId,
        payment_type: 'CREDIT_ACCOUNT',
        payment_method: 'CREDIT_ACCOUNT',
        items: [
          { product_id: testProductId, quantity: 1 }
        ]
      });

    expect(saleRes.status).toBe(201);

    // Verificar aumento en saldo del cliente a 10000
    const custDetail = await request(app)
      .get(`/api/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(custDetail.body.customer.credit_balance).toBe(10000);
    expect(custDetail.body.movements.length).toBeGreaterThan(0);

    // Registrar Pago parcial de $5000 a la cuenta corriente
    const payRes = await request(app)
      .post(`/api/customers/${testCustomerId}/payment`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        amount: 5000,
        payment_method: 'TRANSFER',
        notes: 'Abono transferencia bancaria'
      });

    expect(payRes.status).toBe(200);

    // Verificar que el nuevo saldo sea $5000
    const updatedCust = await request(app)
      .get(`/api/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(updatedCust.body.customer.credit_balance).toBe(5000);
  });

});
