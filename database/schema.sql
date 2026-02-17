-- ERP SaaS Platform - MySQL Database Schema
-- Version: 1.0
-- Database: erp_saas

-- Drop existing database if exists
DROP DATABASE IF EXISTS erp_saas;

-- Create database
CREATE DATABASE erp_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE erp_saas;

-- =====================================================
-- TENANTS TABLE
-- Multi-tenant organization data
-- =====================================================
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscription ENUM('trial', 'basic', 'premium', 'enterprise') DEFAULT 'trial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USERS TABLE
-- User accounts with tenant association
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CUSTOMERS TABLE
-- Customer relationship management
-- =====================================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PRODUCTS TABLE
-- Product catalog management
-- =====================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SALES_ORDERS TABLE
-- Sales order tracking
-- =====================================================
CREATE TABLE sales_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEDGER_ENTRIES TABLE
-- Accounting ledger for financial transactions
-- =====================================================
CREATE TABLE ledger_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    description VARCHAR(500) NOT NULL,
    type ENUM('debit', 'credit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_tenant (tenant_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample tenant
INSERT INTO tenants (company_name, email, subscription) 
VALUES ('Demo Company Inc.', 'demo@example.com', 'premium');

-- Get the tenant ID
SET @tenant_id = LAST_INSERT_ID();

-- Insert sample user (password is 'password123' hashed with bcrypt)
-- Note: You'll need to update this with actual bcrypt hash
INSERT INTO users (tenant_id, email, password, role) 
VALUES (@tenant_id, 'demo@example.com', '$2b$10$YourHashedPasswordHere', 'admin');

-- Insert sample customers
INSERT INTO customers (tenant_id, name, email, phone) VALUES
(@tenant_id, 'John Smith', 'john.smith@email.com', '+1-555-0101'),
(@tenant_id, 'Jane Doe', 'jane.doe@email.com', '+1-555-0102'),
(@tenant_id, 'Bob Johnson', 'bob.johnson@email.com', '+1-555-0103');

-- Insert sample products
INSERT INTO products (tenant_id, name, description, price, stock) VALUES
(@tenant_id, 'Laptop Pro 15"', 'High-performance laptop for professionals', 1299.99, 45),
(@tenant_id, 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 150),
(@tenant_id, 'USB-C Hub', '7-in-1 USB-C hub with HDMI and card reader', 49.99, 78);

-- Insert sample sales orders
INSERT INTO sales_orders (tenant_id, customer_name, amount, status) VALUES
(@tenant_id, 'John Smith', 1329.98, 'completed'),
(@tenant_id, 'Jane Doe', 2599.98, 'pending'),
(@tenant_id, 'Bob Johnson', 79.98, 'completed');

-- Insert sample ledger entries
INSERT INTO ledger_entries (tenant_id, description, type, amount) VALUES
(@tenant_id, 'Sale - Laptop Pro 15"', 'credit', 1299.99),
(@tenant_id, 'Purchase - Office supplies', 'debit', 150.00),
(@tenant_id, 'Sale - Wireless Mouse x2', 'credit', 59.98),
(@tenant_id, 'Utility bill payment', 'debit', 320.50),
(@tenant_id, 'Sale - USB-C Hub', 'credit', 49.99);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Tenant summary view
CREATE VIEW tenant_summary AS
SELECT 
    t.id,
    t.company_name,
    t.email,
    t.subscription,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT so.id) as sales_order_count,
    COALESCE(SUM(so.amount), 0) as total_revenue
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
LEFT JOIN products p ON t.id = p.tenant_id
LEFT JOIN sales_orders so ON t.id = so.tenant_id AND so.status = 'completed'
GROUP BY t.id, t.company_name, t.email, t.subscription;

-- Ledger balance view
CREATE VIEW ledger_balance AS
SELECT 
    tenant_id,
    SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credit,
    SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debit,
    SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as net_balance
FROM ledger_entries
GROUP BY tenant_id;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to get tenant dashboard stats
DELIMITER //
CREATE PROCEDURE GetTenantDashboard(IN p_tenant_id INT)
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM customers WHERE tenant_id = p_tenant_id) as total_customers,
        (SELECT COUNT(*) FROM products WHERE tenant_id = p_tenant_id) as total_products,
        (SELECT COUNT(*) FROM sales_orders WHERE tenant_id = p_tenant_id) as total_orders,
        (SELECT COUNT(*) FROM ledger_entries WHERE tenant_id = p_tenant_id) as total_ledger_entries,
        (SELECT COALESCE(SUM(amount), 0) FROM sales_orders WHERE tenant_id = p_tenant_id AND status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) FROM ledger_entries WHERE tenant_id = p_tenant_id) as ledger_balance;
END //
DELIMITER ;

-- Procedure to delete tenant and all associated data
DELIMITER //
CREATE PROCEDURE DeleteTenant(IN p_tenant_id INT)
BEGIN
    -- Start transaction
    START TRANSACTION;
    
    -- Delete will cascade automatically due to foreign keys
    DELETE FROM tenants WHERE id = p_tenant_id;
    
    -- Commit transaction
    COMMIT;
END //
DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_customers_tenant_created ON customers(tenant_id, created_at);
CREATE INDEX idx_products_tenant_name ON products(tenant_id, name);
CREATE INDEX idx_sales_tenant_status ON sales_orders(tenant_id, status);
CREATE INDEX idx_ledger_tenant_type ON ledger_entries(tenant_id, type);

-- =====================================================
-- GRANTS (Optional - for production)
-- =====================================================
-- Run these commands to create a dedicated database user:
/*
CREATE USER 'erp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON erp_saas.* TO 'erp_user'@'localhost';
FLUSH PRIVILEGES;
*/

-- =====================================================
-- DATABASE INFORMATION
-- =====================================================
SELECT 
    'Database setup complete!' as message,
    DATABASE() as current_database,
    VERSION() as mysql_version;

-- Show all tables
SHOW TABLES;

-- Show table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'erp_saas'
ORDER BY (data_length + index_length) DESC;
