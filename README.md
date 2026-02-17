# 🚀 ERP SaaS Platform - MySQL Backend Edition

## Complete Migration from Firebase to MySQL

This version replaces Firebase with a **MySQL database** and **Express.js REST API backend**.

---

## 📦 Project Structure

```
erp-mysql-complete/
├── backend/                    # Node.js + Express + MySQL
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   └── database/
│       └── schema.sql         # MySQL database schema
│
└── frontend/                   # React + Vite
    ├── src/
    │   ├── App.jsx            # Main React component (modified for API)
    │   ├── api.js             # API service layer
    │   └── main.jsx           # Entry point
    ├── package.json           # Frontend dependencies
    └── .env.example           # Frontend environment variables
```

---

## ⚙️ Backend Setup

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ installed and running
- Terminal/Command prompt

### Step 1: Install MySQL

**Windows:**
```bash
# Download from https://dev.mysql.com/downloads/mysql/
# Or use chocolatey:
choco install mysql
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### Step 2: Secure MySQL Installation

```bash
# Run MySQL secure installation
sudo mysql_secure_installation

# Set root password when prompted
# Answer 'Y' to all security questions
```

### Step 3: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
mysql -u root -p < backend/database/schema.sql

# Or manually:
# CREATE DATABASE erp_saas;
# USE erp_saas;
# (then paste the schema.sql content)
```

### Step 4: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use any text editor
```

**Edit `.env` file:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=erp_saas
JWT_SECRET=your-super-secret-key-change-this
FRONTEND_URL=http://localhost:5173
```

### Step 5: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend will run on: `http://localhost:5000`

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Create .env file
cp .env.example .env
```

**Edit `.env` file:**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Frontend

```bash
# Development mode
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

## 🗄️ Database Schema Overview

### Tables Created

1. **tenants** - Multi-tenant organizations
   - id, company_name, email, subscription, created_at, updated_at

2. **users** - User accounts
   - id, tenant_id, email, password (hashed), role, created_at, updated_at

3. **customers** - Customer data
   - id, tenant_id, name, email, phone, created_at, updated_at

4. **products** - Product catalog
   - id, tenant_id, name, description, price, stock, created_at, updated_at

5. **sales_orders** - Sales tracking
   - id, tenant_id, customer_name, amount, status, created_at, updated_at

6. **ledger_entries** - Accounting ledger
   - id, tenant_id, description, type (debit/credit), amount, created_at, updated_at

### Sample Data Included

The schema includes sample data for testing:
- 1 demo tenant (Demo Company Inc.)
- 3 sample customers
- 3 sample products
- 3 sample sales orders
- 5 sample ledger entries

---

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new tenant | No |
| POST | `/api/auth/login` | Login user | No |

### Tenants

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tenants` | Get all tenants | Yes (Super Admin) |
| GET | `/api/tenants/:id` | Get tenant by ID | Yes |

### Customers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/customers` | Get all customers | Yes |
| POST | `/api/customers` | Create customer | Yes |
| PUT | `/api/customers/:id` | Update customer | Yes |
| DELETE | `/api/customers/:id` | Delete customer | Yes |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | Yes |
| POST | `/api/products` | Create product | Yes |
| PUT | `/api/products/:id` | Update product | Yes |
| DELETE | `/api/products/:id` | Delete product | Yes |

### Sales Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sales-orders` | Get all orders | Yes |
| POST | `/api/sales-orders` | Create order | Yes |
| PUT | `/api/sales-orders/:id` | Update order | Yes |
| DELETE | `/api/sales-orders/:id` | Delete order | Yes |

### Ledger Entries

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ledger-entries` | Get all entries | Yes |
| POST | `/api/ledger-entries` | Create entry | Yes |
| PUT | `/api/ledger-entries/:id` | Update entry | Yes |
| DELETE | `/api/ledger-entries/:id` | Delete entry | Yes |

---

## 🔒 Authentication Flow

### Registration
```javascript
POST /api/auth/register
Body: {
  "email": "user@company.com",
  "password": "password123",
  "companyName": "My Company"
}

Response: {
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "tenantId": 1,
    "companyName": "My Company",
    "role": "admin"
  }
}
```

### Login
```javascript
POST /api/auth/login
Body: {
  "email": "user@company.com",
  "password": "password123"
}

Response: {
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### Using JWT Token
```javascript
// All authenticated requests must include:
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","companyName":"Test Co"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Get customers (replace TOKEN with your JWT)
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer TOKEN"

# Create customer
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"John Doe","email":"john@email.com","phone":"555-0100"}'
```

### Using Postman

1. Import the included Postman collection (if provided)
2. Set `{{baseUrl}}` variable to `http://localhost:5000/api`
3. After login, set `{{token}}` variable with the JWT token
4. All requests will automatically include the auth token

---

## 🔄 Migration from Firebase

### Key Changes

1. **Authentication**
   - Firebase Auth → JWT tokens
   - `onAuthStateChanged` → Token validation
   - `signInWithEmailAndPassword` → `/api/auth/login`

2. **Data Storage**
   - Firestore → MySQL tables
   - Real-time listeners → REST API calls
   - Collections → Database tables
   - Documents → Database rows

3. **Data Access**
   - `getDocs()` → `fetch('/api/endpoint')`
   - `addDoc()` → `POST /api/endpoint`
   - `updateDoc()` → `PUT /api/endpoint/:id`
   - `deleteDoc()` → `DELETE /api/endpoint/:id`

### Code Comparison

**Before (Firebase):**
```javascript
// Login
await signInWithEmailAndPassword(auth, email, password);

// Get data
const snapshot = await getDocs(collection(db, 'customers'));
const customers = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

// Add data
await addDoc(collection(db, 'customers'), customerData);
```

**After (MySQL API):**
```javascript
// Login
const { token, user } = await authAPI.login(email, password);

// Get data
const customers = await customersAPI.getAll();

// Add data
await customersAPI.create(customerData);
```

---

## 🛠️ Database Management

### Useful MySQL Commands

```sql
-- View all tables
SHOW TABLES;

-- View table structure
DESCRIBE customers;

-- View all tenants
SELECT * FROM tenants;

-- View customer count per tenant
SELECT t.company_name, COUNT(c.id) as customer_count
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
GROUP BY t.id;

-- View total revenue per tenant
SELECT t.company_name, SUM(so.amount) as total_revenue
FROM tenants t
LEFT JOIN sales_orders so ON t.id = so.tenant_id
WHERE so.status = 'completed'
GROUP BY t.id;

-- Backup database
mysqldump -u root -p erp_saas > backup.sql

-- Restore database
mysql -u root -p erp_saas < backup.sql
```

### Reset Database

```bash
# Using npm script
cd backend
npm run db:reset

# Or manually
mysql -u root -p -e "DROP DATABASE IF EXISTS erp_saas"
mysql -u root -p < database/schema.sql
```

---

## 🚀 Deployment

### Backend Deployment (Node.js)

**Options:**
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Railway
- Render

**Environment Variables to Set:**
```
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=erp_saas
JWT_SECRET=your-production-secret
```

### Database Deployment (MySQL)

**Options:**
- AWS RDS (MySQL)
- DigitalOcean Managed Database
- Google Cloud SQL
- Azure Database for MySQL
- PlanetScale

### Frontend Deployment (React)

**Options:**
- Vercel
- Netlify
- AWS S3 + CloudFront
- DigitalOcean Static Sites

**Build Commands:**
```bash
cd frontend
npm run build
# Upload dist/ folder to hosting
```

---

## 📊 Performance Optimization

### Database Indexes
The schema includes optimized indexes for common queries:
```sql
-- Example indexes
CREATE INDEX idx_customers_tenant_created ON customers(tenant_id, created_at);
CREATE INDEX idx_products_tenant_name ON products(tenant_id, name);
```

### Connection Pooling
The backend uses connection pooling for better performance:
```javascript
connectionLimit: 10  // Adjust based on your needs
```

### Caching Strategy
Consider implementing:
- Redis for session management
- API response caching
- Database query caching

---

## 🔐 Security Best Practices

✅ **Implemented:**
- Password hashing with bcrypt
- JWT token authentication
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection

⚠️ **Recommended for Production:**
- HTTPS/SSL encryption
- Rate limiting
- Input validation & sanitization
- API key authentication for sensitive endpoints
- Database backup automation
- Error logging service (Sentry)
- WAF (Web Application Firewall)

---

## 📝 License

Private - All rights reserved

---

## 🆘 Troubleshooting

### MySQL Connection Issues

**Error:** `ER_ACCESS_DENIED_ERROR`
```bash
# Reset MySQL root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
```

**Error:** `ER_NOT_SUPPORTED_AUTH_MODE`
```bash
# Update authentication method
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 PID  # macOS/Linux
taskkill /PID pid /F  # Windows
```

### CORS Issues

Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL:
```env
FRONTEND_URL=http://localhost:5173
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check MySQL error logs
4. Verify environment variables

---

**Built with ❤️ using Node.js, Express, MySQL, and React**
