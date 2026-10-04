-- ===================================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL) - AMORE MÍO
-- Copia y pega todo este código en el SQL Editor de tu panel en Supabase.
-- ===================================================================

-- 1. Tabla de Usuarios (Administrador, Vendedores, SuperAdmin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('ADMIN', 'SELLER', 'MANAGER', 'SUPERADMIN')) NOT NULL DEFAULT 'SELLER',
    commission_type VARCHAR(50) CHECK (commission_type IN ('PERCENTAGE', 'FIXED')) NOT NULL DEFAULT 'PERCENTAGE',
    commission_value NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    must_change_password INT NOT NULL DEFAULT 0,
    active INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Categorías
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    profit_percentage NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    image_url TEXT,
    is_published INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Clientes
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    credit_balance NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 50000.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Ventas
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
    seller_id INT NOT NULL REFERENCES users(id),
    payment_type VARCHAR(50) CHECK (payment_type IN ('CASH_ON_HAND', 'CREDIT_ACCOUNT')) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('CASH', 'TRANSFER', 'QR', 'CREDIT_ACCOUNT')) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    total NUMERIC(12,2) NOT NULL,
    seller_commission NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    replacement_cost NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    net_profit NUMERIC(12,2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) CHECK (status IN ('COMPLETED', 'CANCELLED')) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Movimientos de Cuenta Corriente
CREATE TABLE IF NOT EXISTS credit_movements (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id INT REFERENCES sales(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('DEBIT', 'CREDIT')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    due_date DATE,
    status VARCHAR(50) CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de Items de Venta
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_cost_price NUMERIC(12,2) NOT NULL,
    unit_sale_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
);

-- 9. Tabla de Movimientos de Caja
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id) ON DELETE SET NULL,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) CHECK (type IN ('INCOME', 'EXPENSE')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('CASH', 'TRANSFER', 'QR')) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'SALE',
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- SEED DATA INICIAL PARA SUPABASE
-- ===================================================================

-- Administrador del Local (vampyfz1214@gmail.com / qwerty1234)
INSERT INTO users (name, email, password_hash, role, must_change_password)
VALUES ('Administrador Amore Mío', 'vampyfz1214@gmail.com', '$2a$10$w8T9V.w.xX8ZqT8y9.y9ueS1vN6V6V6V6V6V6V6V6V6V6V6V6V6V6', 'ADMIN', 1)
ON CONFLICT (email) DO NOTHING;

-- SuperAdministrador Roldfy Studio (martinchiacchio@gmail.com / qwerty1234)
INSERT INTO users (name, email, password_hash, role, must_change_password)
VALUES ('Soporte Roldfy Studio', 'martinchiacchio@gmail.com', '$2a$10$w8T9V.w.xX8ZqT8y9.y9ueS1vN6V6V6V6V6V6V6V6V6V6V6V6V6V6', 'SUPERADMIN', 1)
ON CONFLICT (email) DO NOTHING;

-- Vendedor de Ejemplo (vendedor@amoremio.com / vendedor123)
INSERT INTO users (name, email, password_hash, role, commission_type, commission_value, must_change_password)
VALUES ('Camila Vendedora', 'vendedor@amoremio.com', '$2a$10$w8T9V.w.xX8ZqT8y9.y9ueS1vN6V6V6V6V6V6V6V6V6V6V6V6V6V6', 'SELLER', 'PERCENTAGE', 10.0, 0)
ON CONFLICT (email) DO NOTHING;

-- Categorías por defecto
INSERT INTO categories (name, description) VALUES
('Conjuntos Femeninos', 'Conjuntos de encaje, algodón y microfibra'),
('Lencería Fina', 'Bodys, babydolls y prendas especiales'),
('Ropa Interior Masculina', 'Boxers, slips y camisetas'),
('Pijamas & Homewear', 'Pijamas para él y para ella'),
('Accesorios & Medias', 'Medias, arneses y complementos')
ON CONFLICT (name) DO NOTHING;
