const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_saas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// =====================
// AUTH ROUTES
// =====================

// Register new tenant
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    // Validate input
    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant
    const [tenantResult] = await pool.query(
      'INSERT INTO tenants (company_name, email, subscription, created_at) VALUES (?, ?, ?, NOW())',
      [companyName, email, 'trial']
    );

    const tenantId = tenantResult.insertId;

    // Create user
    const [userResult] = await pool.query(
      'INSERT INTO users (tenant_id, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [tenantId, email, hashedPassword, 'admin']
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: userResult.insertId, tenantId, email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userResult.insertId,
        email,
        tenantId,
        companyName,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check for super admin
    if (email === 'superadmin@yourcompany.com') {
      if (password === 'admin123') {
        const token = jwt.sign(
          { userId: 0, email, role: 'superadmin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: {
            id: 0,
            email,
            role: 'superadmin'
          }
        });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Find user
    const [users] = await pool.query(
      'SELECT u.*, t.company_name, t.subscription FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        companyName: user.company_name,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// =====================
// TENANT ROUTES
// =====================

// Get all tenants (Super Admin only)
app.get('/api/tenants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [tenants] = await pool.query(
      'SELECT id, company_name, email, subscription, created_at FROM tenants ORDER BY created_at DESC'
    );

    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get tenant info
app.get('/api/tenants/:id', authenticateToken, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id);

    // Check authorization
    if (req.user.role !== 'superadmin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [tenants] = await pool.query(
      'SELECT id, company_name, email, subscription, created_at FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenants[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// =====================
// CUSTOMER ROUTES
// =====================

// Get all customers for a tenant
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const [customers] = await pool.query(
      'SELECT * FROM customers WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenantId]
    );

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer
app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO customers (tenant_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.user.tenantId, name, email, phone]
    );

    const [newCustomer] = await pool.query(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { name, email, phone } = req.body;

    await pool.query(
      'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ? AND tenant_id = ?',
      [name, email, phone, customerId, req.user.tenantId]
    );

    const [updatedCustomer] = await pool.query(
      'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, req.user.tenantId]
    );

    if (updatedCustomer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
      [customerId, req.user.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// =====================
// PRODUCT ROUTES
// =====================

// Get all products for a tenant
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenantId]
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    if (!name || price == null || stock == null) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (tenant_id, name, description, price, stock, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.user.tenantId, name, description || '', price, stock]
    );

    const [newProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, stock } = req.body;

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ? AND tenant_id = ?',
      [name, description, price, stock, productId, req.user.tenantId]
    );

    const [updatedProduct] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
      [productId, req.user.tenantId]
    );

    if (updatedProduct.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM products WHERE id = ? AND tenant_id = ?',
      [productId, req.user.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// =====================
// SALES ORDER ROUTES
// =====================

// Get all sales orders for a tenant
app.get('/api/sales-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM sales_orders WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenantId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// Create sales order
app.post('/api/sales-orders', authenticateToken, async (req, res) => {
  try {
    const { customerName, amount } = req.body;

    if (!customerName || amount == null) {
      return res.status(400).json({ error: 'Customer name and amount are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO sales_orders (tenant_id, customer_name, amount, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.user.tenantId, customerName, amount, 'pending']
    );

    const [newOrder] = await pool.query(
      'SELECT * FROM sales_orders WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
});

// Update sales order
app.put('/api/sales-orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { customerName, amount, status } = req.body;

    await pool.query(
      'UPDATE sales_orders SET customer_name = ?, amount = ?, status = ? WHERE id = ? AND tenant_id = ?',
      [customerName, amount, status, orderId, req.user.tenantId]
    );

    const [updatedOrder] = await pool.query(
      'SELECT * FROM sales_orders WHERE id = ? AND tenant_id = ?',
      [orderId, req.user.tenantId]
    );

    if (updatedOrder.length === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({ error: 'Failed to update sales order' });
  }
});

// Delete sales order
app.delete('/api/sales-orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM sales_orders WHERE id = ? AND tenant_id = ?',
      [orderId, req.user.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({ error: 'Failed to delete sales order' });
  }
});

// =====================
// LEDGER ENTRY ROUTES
// =====================

// Get all ledger entries for a tenant
app.get('/api/ledger-entries', authenticateToken, async (req, res) => {
  try {
    const [entries] = await pool.query(
      'SELECT * FROM ledger_entries WHERE tenant_id = ? ORDER BY created_at DESC',
      [req.user.tenantId]
    );

    res.json(entries);
  } catch (error) {
    console.error('Error fetching ledger entries:', error);
    res.status(500).json({ error: 'Failed to fetch ledger entries' });
  }
});

// Create ledger entry
app.post('/api/ledger-entries', authenticateToken, async (req, res) => {
  try {
    const { description, type, amount } = req.body;

    if (!description || !type || amount == null) {
      return res.status(400).json({ error: 'Description, type, and amount are required' });
    }

    if (!['debit', 'credit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either debit or credit' });
    }

    const [result] = await pool.query(
      'INSERT INTO ledger_entries (tenant_id, description, type, amount, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.user.tenantId, description, type, amount]
    );

    const [newEntry] = await pool.query(
      'SELECT * FROM ledger_entries WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: 'Failed to create ledger entry' });
  }
});

// Update ledger entry
app.put('/api/ledger-entries/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = parseInt(req.params.id);
    const { description, type, amount } = req.body;

    if (!['debit', 'credit'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either debit or credit' });
    }

    await pool.query(
      'UPDATE ledger_entries SET description = ?, type = ?, amount = ? WHERE id = ? AND tenant_id = ?',
      [description, type, amount, entryId, req.user.tenantId]
    );

    const [updatedEntry] = await pool.query(
      'SELECT * FROM ledger_entries WHERE id = ? AND tenant_id = ?',
      [entryId, req.user.tenantId]
    );

    if (updatedEntry.length === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    res.json(updatedEntry[0]);
  } catch (error) {
    console.error('Error updating ledger entry:', error);
    res.status(500).json({ error: 'Failed to update ledger entry' });
  }
});

// Delete ledger entry
app.delete('/api/ledger-entries/:id', authenticateToken, async (req, res) => {
  try {
    const entryId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM ledger_entries WHERE id = ? AND tenant_id = ?',
      [entryId, req.user.tenantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ledger entry not found' });
    }

    res.json({ message: 'Ledger entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting ledger entry:', error);
    res.status(500).json({ error: 'Failed to delete ledger entry' });
  }
});

// =====================
// SERVER START
// =====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
