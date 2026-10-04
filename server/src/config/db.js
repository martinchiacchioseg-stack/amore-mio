import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : `file:${path.join(dbDir, 'amoremio.db')}`;

export const client = createClient({
  url: dbPath
});

export async function initDb() {
  // Enable foreign keys
  await client.execute('PRAGMA foreign_keys = ON;');

  // 1. Users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN')) NOT NULL DEFAULT 'SELLER',
      commission_type TEXT CHECK(commission_type IN ('PERCENTAGE', 'FIXED')) NOT NULL DEFAULT 'PERCENTAGE',
      commission_value REAL NOT NULL DEFAULT 0.0,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Suppliers table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Categories table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )
  `);

  // 4. Products table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      cost_price REAL NOT NULL DEFAULT 0.0,
      sale_price REAL NOT NULL DEFAULT 0.0,
      profit_percentage REAL NOT NULL DEFAULT 0.0,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 5,
      image_url TEXT,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Customers table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      credit_balance REAL NOT NULL DEFAULT 0.0,
      credit_limit REAL NOT NULL DEFAULT 50000.0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Sales table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      payment_type TEXT CHECK(payment_type IN ('CASH_ON_HAND', 'CREDIT_ACCOUNT')) NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('CASH', 'TRANSFER', 'QR', 'CREDIT_ACCOUNT')) NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0.0,
      total REAL NOT NULL,
      seller_commission REAL NOT NULL DEFAULT 0.0,
      replacement_cost REAL NOT NULL DEFAULT 0.0,
      net_profit REAL NOT NULL DEFAULT 0.0,
      status TEXT CHECK(status IN ('COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 7. Credit Movements table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS credit_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      type TEXT CHECK(type IN ('DEBIT', 'CREDIT')) NOT NULL,
      amount REAL NOT NULL,
      due_date DATE,
      status TEXT CHECK(status IN ('PENDING', 'PAID', 'OVERDUE')) NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 8. Sale Items table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_cost_price REAL NOT NULL,
      unit_sale_price REAL NOT NULL,
      subtotal REAL NOT NULL
    )
  `);

  // 9. Cash Movements table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
      seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type TEXT CHECK(type IN ('INCOME', 'EXPENSE')) NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('CASH', 'TRANSFER', 'QR')) NOT NULL,
      category TEXT NOT NULL DEFAULT 'SALE',
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default Users if missing
  const adminRes = await client.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['vampyfz1214@gmail.com']
  });

  if (adminRes.rows.length === 0) {
    const adminPass = bcrypt.hashSync('qwerty1234', 10);
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, 'ADMIN', 1)`,
      args: ['Administrador Amore Mío', 'vampyfz1214@gmail.com', adminPass]
    });
  } else {
    // Ensure initial provisional password is updated
    const adminPass = bcrypt.hashSync('qwerty1234', 10);
    await client.execute({
      sql: `UPDATE users SET password_hash = ?, must_change_password = 1 WHERE email = ?`,
      args: [adminPass, 'vampyfz1214@gmail.com']
    });
  }

  const superRes = await client.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['martinchiacchio.seg@gmail.com']
  });

  if (superRes.rows.length === 0) {
    const superPass = bcrypt.hashSync('qwerty1234', 10);
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (?, ?, ?, 'SUPERADMIN', 1)`,
      args: ['Soporte RolΦ Studio', 'martinchiacchio.seg@gmail.com', superPass]
    });
  } else {
    const superPass = bcrypt.hashSync('qwerty1234', 10);
    await client.execute({
      sql: `UPDATE users SET password_hash = ?, must_change_password = 1 WHERE email = ?`,
      args: [superPass, 'martinchiacchio.seg@gmail.com']
    });
  }

  // Seed default categories
  const catCountRes = await client.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(catCountRes.rows[0].count) === 0) {
    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: ['Conjuntos Femeninos', 'Conjuntos de encaje, algodón y microfibra']
    });
    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: ['Lencería Fina', 'Bodys, babydolls y prendas especiales']
    });
    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: ['Ropa Interior Masculina', 'Boxers, slips y camisetas']
    });
    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: ['Pijamas & Homewear', 'Pijamas para él y para ella']
    });
    await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: ['Accesorios & Medias', 'Medias, arneses y complementos']
    });
  }

  // Seed default suppliers
  const supCountRes = await client.execute('SELECT COUNT(*) as count FROM suppliers');
  if (Number(supCountRes.rows[0].count) === 0) {
    await client.execute({
      sql: 'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      args: ['Textil Romance S.A.', 'Laura Gómez', '+54 9 11 4455-8899', 'contacto@textilromance.com', 'Av. Corrientes 1234, CABA']
    });
    await client.execute({
      sql: 'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      args: ['Confecciones Delicadeza', 'Carlos Rossi', '+54 9 341 5566-7788', 'ventas@delicadeza.com', 'San Martín 456, Rosario']
    });
  }

  // Seed default seller
  const sellerRes = await client.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['vendedor@amoremio.com']
  });
  if (sellerRes.rows.length === 0) {
    const sellerPass = bcrypt.hashSync('vendedor123', 10);
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, commission_type, commission_value, must_change_password)
            VALUES (?, ?, ?, 'SELLER', 'PERCENTAGE', 10.0, 0)`,
      args: ['Camila Vendedora', 'vendedor@amoremio.com', sellerPass]
    });
  }

  // Seed default products
  const prodCountRes = await client.execute('SELECT COUNT(*) as count FROM products');
  if (Number(prodCountRes.rows[0].count) === 0) {
    await client.execute({
      sql: `INSERT INTO products (code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published)
            VALUES (?, ?, ?, 1, 1, 6500, 14900, 129.23, 15, 3, 1)`,
      args: ['ART-101', 'Conjunto Encaje Sensazione', 'Conjunto de encaje elastizado con aro y colaless']
    });
    await client.execute({
      sql: `INSERT INTO products (code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published)
            VALUES (?, ?, ?, 2, 1, 8900, 19800, 122.47, 8, 2, 1)`,
      args: ['ART-102', 'Body Soft Velvet', 'Body de terciopelo con transparencias']
    });
    await client.execute({
      sql: `INSERT INTO products (code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published)
            VALUES (?, ?, ?, 3, 2, 3200, 7500, 134.37, 25, 5, 1)`,
      args: ['ART-201', 'Boxer Seamless Confort', 'Boxer sin costuras 100% algodón peinado']
    });
    await client.execute({
      sql: `INSERT INTO products (code, name, description, category_id, supplier_id, cost_price, sale_price, profit_percentage, stock, min_stock_alert, is_published)
            VALUES (?, ?, ?, 4, 1, 12000, 26900, 124.16, 2, 4, 1)`,
      args: ['ART-301', 'Pijama Satin Elegance', 'Pijama de raso 2 piezas (saco y pantalón)']
    });
  }

  // Seed default customer
  const custCountRes = await client.execute('SELECT COUNT(*) as count FROM customers');
  if (Number(custCountRes.rows[0].count) === 0) {
    await client.execute({
      sql: `INSERT INTO customers (name, phone, email, address, credit_balance, credit_limit, notes)
            VALUES (?, ?, ?, ?, 14900.0, 60000.0, ?)`,
      args: ['María Belén Fernández', '+5493416123456', 'maria.belen@gmail.com', 'Mitre 890, Rosario', 'Cliente frecuente - Cuenta corriente activa']
    });
  }
}
