import React, { useState, useEffect } from 'react';
import { Plus, Package, FileText, Users, DollarSign, TrendingUp, Search, Edit, Trash2, Check, X, Settings, LogOut, Building2, CreditCard, BarChart3, UserPlus, Shield } from 'lucide-react';

// Firebase configuration (you'll add your own keys later)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_8YiPfXkZggJQOZGjxiPwMHSzWSH-pOQ",
  authDomain: "erp-saas-platform.firebaseapp.com",
  projectId: "erp-saas-platform",
  storageBucket: "erp-saas-platform.firebasestorage.app",
  messagingSenderId: "232433018921",
  appId: "1:232433018921:web:99de012385c65522af1438"
  measurementId: "G-QSLX22N53H"
};

const SaaSERPPlatform = () => {
  // Auth & Tenant Management
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeView, setActiveView] = useState('login');
  const [activeModule, setActiveModule] = useState('dashboard');
  
  // Demo data - Will be replaced by Firebase
  const [tenants, setTenants] = useState([
    { 
      id: 1, 
      companyName: 'Acme Manufacturing', 
      email: 'admin@acme.com',
      password: 'demo123', 
      plan: 'Professional',
      status: 'Active', 
      monthlyFee: 199,
      users: 5,
      createdDate: '2026-01-15',
      trialEnds: null,
      lastActive: '2026-02-07'
    },
    { 
      id: 2, 
      companyName: 'TechStart Solutions', 
      email: 'contact@techstart.com',
      password: 'demo123', 
      plan: 'Starter',
      status: 'Trial', 
      monthlyFee: 99,
      users: 2,
      createdDate: '2026-02-01',
      trialEnds: '2026-02-15',
      lastActive: '2026-02-06'
    }
  ]);

  const [tenantData, setTenantData] = useState({
    1: {
      customers: [
        { id: 1, name: 'ABC Corp', email: 'sales@abc.com', phone: '555-1000', status: 'Active' }
      ],
      products: [
        { id: 1, name: 'Widget A', sku: 'WDG-001', stock: 250, price: 45, cost: 28 }
      ],
      salesOrders: [
        { id: 1, soNumber: 'SO-001', customer: 'ABC Corp', date: '2026-02-05', status: 'Confirmed', total: 2250, items: [{ product: 'Widget A', qty: 50, price: 45 }] }
      ],
      purchaseOrders: [],
      invoices: [],
      returns: [],
      grns: [],
      ledgerEntries: [
        { id: 1, date: '2026-02-05', type: 'Revenue', description: 'Sales Order SO-001', debit: 0, credit: 2250, balance: 2250 }
      ]
    },
    2: {
      customers: [],
      products: [],
      salesOrders: [],
      purchaseOrders: [],
      invoices: [],
      returns: [],
      grns: [],
      ledgerEntries: []
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  // Login handler - FIXED
  const handleLogin = (email, password, isSuperAdmin) => {
    console.log('Login attempt:', email, isSuperAdmin);
    
    if (isSuperAdmin && email === 'superadmin@yourcompany.com' && password === 'admin123') {
      setCurrentUser({ email, name: 'Super Admin' });
      setUserRole('superadmin');
      setActiveView('superadmin');
      console.log('Super admin login successful');
      return;
    }
    
    // Customer login
    const tenant = tenants.find(t => t.email === email && t.password === password);
    console.log('Found tenant:', tenant);
    
    if (tenant) {
      setCurrentUser({ email, name: 'Admin User' });
      setCurrentTenant(tenant);
      setUserRole('admin');
      setActiveView('erp');
      console.log('Customer login successful');
    } else {
      alert('Invalid credentials!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTenant(null);
    setUserRole(null);
    setActiveView('login');
    setActiveModule('dashboard');
  };

  const handleSignup = (companyData) => {
    const newTenant = {
      id: tenants.length + 1,
      companyName: companyData.companyName,
      email: companyData.email,
      password: companyData.password,
      plan: 'Starter',
      status: 'Trial',
      monthlyFee: 99,
      users: 1,
      createdDate: new Date().toISOString().split('T')[0],
      trialEnds: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      lastActive: new Date().toISOString().split('T')[0]
    };
    
    setTenants([...tenants, newTenant]);
    setTenantData({
      ...tenantData,
      [newTenant.id]: {
        customers: [],
        products: [],
        salesOrders: [],
        purchaseOrders: [],
        invoices: [],
        returns: [],
        grns: [],
        ledgerEntries: []
      }
    });
    
    // Auto-login
    setCurrentUser({ email: companyData.email, name: companyData.contactName });
    setCurrentTenant(newTenant);
    setUserRole('admin');
    setActiveView('erp');
    setShowModal(false);
  };

  // Get current tenant data
  const getCurrentTenantData = () => {
    if (!currentTenant) return null;
    return tenantData[currentTenant.id] || {
      customers: [],
      products: [],
      salesOrders: [],
      purchaseOrders: [],
      invoices: [],
      returns: [],
      grns: [],
      ledgerEntries: []
    };
  };

  const updateTenantData = (dataType, newData) => {
    if (!currentTenant) return;
    setTenantData({
      ...tenantData,
      [currentTenant.id]: {
        ...tenantData[currentTenant.id],
        [dataType]: newData
      }
    });
  };

  // Modal Functions
  const openModal = (type, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
  };

  // CRUD Operations
  const addCustomer = (customer) => {
    const data = getCurrentTenantData();
    updateTenantData('customers', [...data.customers, { ...customer, id: data.customers.length + 1, status: 'Active' }]);
    closeModal();
  };

  const addProduct = (product) => {
    const data = getCurrentTenantData();
    updateTenantData('products', [...data.products, { 
      ...product, 
      id: data.products.length + 1, 
      stock: parseInt(product.stock || 0),
      price: parseFloat(product.price || 0),
      cost: parseFloat(product.cost || 0)
    }]);
    closeModal();
  };

  const addSalesOrder = (so, items) => {
    const data = getCurrentTenantData();
    const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const newSO = { 
      ...so, 
      id: data.salesOrders.length + 1, 
      soNumber: `SO-${String(data.salesOrders.length + 1).padStart(3, '0')}`, 
      total, 
      status: 'Confirmed',
      items 
    };
    
    updateTenantData('salesOrders', [...data.salesOrders, newSO]);
    
    // Update inventory
    const updatedProducts = data.products.map(p => {
      const item = items.find(i => i.product === p.name);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    });
    updateTenantData('products', updatedProducts);
    
    // Add ledger entry
    const lastBalance = data.ledgerEntries.length > 0 ? data.ledgerEntries[data.ledgerEntries.length - 1].balance : 0;
    const newLedgerEntry = {
      id: data.ledgerEntries.length + 1,
      date: new Date().toISOString().split('T')[0],
      type: 'Revenue',
      description: `Sales Order ${newSO.soNumber}`,
      debit: 0,
      credit: total,
      balance: lastBalance + total
    };
    updateTenantData('ledgerEntries', [...data.ledgerEntries, newLedgerEntry]);
    
    closeModal();
  };

  // Super Admin Functions
  const updateTenantStatus = (tenantId, newStatus) => {
    setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t));
  };

  const upgradeTenantPlan = (tenantId, newPlan) => {
    const planPricing = { 'Starter': 99, 'Professional': 199, 'Enterprise': 499 };
    setTenants(tenants.map(t => 
      t.id === tenantId ? { ...t, plan: newPlan, monthlyFee: planPricing[newPlan] } : t
    ));
  };

  // Stats
  const superAdminStats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'Active').length,
    trialTenants: tenants.filter(t => t.status === 'Trial').length,
    totalMRR: tenants.filter(t => t.status === 'Active').reduce((sum, t) => sum + t.monthlyFee, 0),
    totalUsers: tenants.reduce((sum, t) => sum + t.users, 0)
  };

  // ==================== LOGIN SCREEN ====================
  const LoginScreen = () => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">ERP SaaS</h1>
            <p className="text-gray-600 mt-2">Business Management Platform</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setIsSuperAdmin(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isSuperAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Customer Login
              </button>
              <button
                onClick={() => setIsSuperAdmin(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isSuperAdmin ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Admin Login
              </button>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin(loginEmail, loginPassword, isSuperAdmin);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={() => handleLogin(loginEmail, loginPassword, isSuperAdmin)}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSuperAdmin ? 'Login as Super Admin' : 'Login'}
            </button>

            {!isSuperAdmin && (
              <>
                <div className="text-center text-gray-500 text-sm">or</div>
                <button
                  onClick={() => openModal('signup')}
                  className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Start Free Trial (14 Days)
                </button>
              </>
            )}

            {isSuperAdmin && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                <p className="font-medium">Demo Credentials:</p>
                <p className="text-xs mt-1">Email: superadmin@yourcompany.com</p>
                <p className="text-xs">Password: admin123</p>
              </div>
            )}

            {!isSuperAdmin && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium">Demo Customer Login:</p>
                <p className="text-xs mt-1">Email: admin@acme.com</p>
                <p className="text-xs">Password: demo123</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== SUPER ADMIN DASHBOARD ====================
  const SuperAdminDashboard = () => (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={28} />
              Super Admin Dashboard
            </h1>
            <p className="text-purple-100 text-sm">Platform Management & Analytics</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-800">{superAdminStats.totalTenants}</p>
              </div>
              <Building2 className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600">{superAdminStats.activeTenants}</p>
              </div>
              <Check className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">On Trial</p>
                <p className="text-3xl font-bold text-yellow-600">{superAdminStats.trialTenants}</p>
              </div>
              <TrendingUp className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold text-purple-600">${superAdminStats.totalMRR.toLocaleString()}</p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-indigo-600">{superAdminStats.totalUsers}</p>
              </div>
              <Users className="text-indigo-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Customer Accounts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building2 size={20} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{tenant.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenant.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={tenant.plan}
                        onChange={(e) => upgradeTenantPlan(tenant.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Starter">Starter</option>
                        <option value="Professional">Professional</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        tenant.status === 'Active' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'Trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${tenant.status === 'Active' ? tenant.monthlyFee : 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {tenant.status === 'Trial' && (
                          <button
                            onClick={() => updateTenantStatus(tenant.id, 'Active')}
                            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                          >
                            Activate
                          </button>
                        )}
                        {tenant.status === 'Active' && (
                          <button
                            onClick={() => updateTenantStatus(tenant.id, 'Suspended')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== CUSTOMER ERP ====================
  const CustomerERP = () => {
    const data = getCurrentTenantData();
    if (!data) {
      console.log('No tenant data available');
      return <div>Loading...</div>;
    }

    const modules = [
      { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
      { id: 'customers', name: 'CRM', icon: Users },
      { id: 'products', name: 'Inventory', icon: Package },
      { id: 'sales', name: 'Sales Orders', icon: FileText },
      { id: 'ledger', name: 'Ledger', icon: DollarSign }
    ];

    const stats = {
      totalRevenue: data.ledgerEntries.filter(e => e.type === 'Revenue').reduce((sum, e) => sum + e.credit, 0),
      totalOrders: data.salesOrders.length,
      totalProducts: data.products.length,
      lowStock: data.products.filter(p => p.stock < 30).length
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{currentTenant?.companyName}</h1>
              <p className="text-blue-100 text-sm">
                {currentTenant?.plan} Plan • {currentTenant?.status}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-4">
            <div className="w-64 bg-white rounded-lg shadow-lg p-4 h-fit">
              <nav className="space-y-1">
                {modules.map(module => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeModule === module.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{module.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1">
              {activeModule === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-900">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="text-blue-600" size={32} />
                      </div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Sales Orders</p>
                          <p className="text-2xl font-bold text-green-900">{stats.totalOrders}</p>
                        </div>
                        <FileText className="text-green-600" size={32} />
                      </div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Products</p>
                          <p className="text-2xl font-bold text-purple-900">{stats.totalProducts}</p>
                        </div>
                        <Package className="text-purple-600" size={32} />
                      </div>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Low Stock</p>
                          <p className="text-2xl font-bold text-orange-900">{stats.lowStock}</p>
                        </div>
                        <TrendingUp className="text-orange-600" size={32} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'customers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">CRM - Customers</h2>
                    <button
                      onClick={() => openModal('customer')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                      <Plus size={20} /> Add Customer
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.customers.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                              No customers yet. Click "Add Customer" to get started.
                            </td>
                          </tr>
                        ) : (
                          data.customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{customer.phone}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  {customer.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModule === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
                    <button
                      onClick={() => openModal('product')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                      <Plus size={20} /> Add Product
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.products.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                              No products yet. Click "Add Product" to get started.
                            </td>
                          </tr>
                        ) : (
                          data.products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.sku}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">${product.price}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModule === 'sales' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Sales Orders</h2>
                    <button
                      onClick={() => openModal('salesorder')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                      <Plus size={20} /> Create Order
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SO #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.salesOrders.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                              No sales orders yet. Click "Create Order" to get started.
                            </td>
                          </tr>
                        ) : (
                          data.salesOrders.map(so => (
                            <tr key={so.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{so.soNumber}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{so.customer}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{so.date}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">${so.total.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModule === 'ledger' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">General Ledger</h2>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.ledgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                              No ledger entries yet.
                            </td>
                          </tr>
                        ) : (
                          data.ledgerEntries.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-600">{entry.date}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                              <td className="px-6 py-4 text-sm text-right text-green-600">
                                ${entry.credit.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                                ${entry.balance.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MODAL ====================
  const Modal = () => {
    const [items, setItems] = useState([{ product: '', qty: 0, price: 0 }]);

    const handleSubmit = (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const formObject = Object.fromEntries(formData.entries());

      if (modalType === 'signup') {
        handleSignup(formObject);
      } else if (modalType === 'customer') {
        addCustomer(formObject);
      } else if (modalType === 'product') {
        addProduct(formObject);
      } else if (modalType === 'salesorder') {
        addSalesOrder(formObject, items);
      }
    };

    if (!showModal) return null;

    const data = getCurrentTenantData();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {modalType === 'signup' && 'Start Your Free Trial'}
                {modalType === 'customer' && 'Add Customer'}
                {modalType === 'product' && 'Add Product'}
                {modalType === 'salesorder' && 'Create Sales Order'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'signup' && (
                <>
                  <input name="companyName" placeholder="Company Name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="contactName" placeholder="Your Name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="email" type="email" placeholder="Business Email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="password" type="password" placeholder="Password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {modalType === 'customer' && (
                <>
                  <input name="name" placeholder="Customer Name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="phone" placeholder="Phone" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {modalType === 'product' && (
                <>
                  <input name="name" placeholder="Product Name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="sku" placeholder="SKU" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="stock" type="number" placeholder="Stock Quantity" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="cost" type="number" step="0.01" placeholder="Cost Price" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <input name="price" type="number" step="0.01" placeholder="Selling Price" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </>
              )}

              {modalType === 'salesorder' && data && (
                <>
                  <select name="customer" required className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select Customer</option>
                    {data.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <input name="date" type="date" required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                  <div className="space-y-2">
                    <label className="font-medium text-gray-700">Items</label>
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={item.product}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].product = e.target.value;
                            const prod = data.products.find(p => p.name === e.target.value);
                            newItems[idx].price = prod?.price || 0;
                            setItems(newItems);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select Product</option>
                          {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].qty = parseInt(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].price = parseFloat(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setItems([...items, { product: '', qty: 0, price: 0 }])}
                      className="text-blue-600 text-sm"
                    >
                      + Add Item
                    </button>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  {modalType === 'signup' ? 'Start Free Trial' : 'Create'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  console.log('Current view:', activeView);
  
  return (
    <>
      {activeView === 'login' && <LoginScreen />}
      {activeView === 'superadmin' && <SuperAdminDashboard />}
      {activeView === 'erp' && <CustomerERP />}
      <Modal />
    </>
  );
};

export default SaaSERPPlatform;
