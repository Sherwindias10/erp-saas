import React, { useState, useEffect } from 'react';
import { Plus, Package, FileText, Users, DollarSign, TrendingUp, LogOut, Building2, Shield, Check, X } from 'lucide-react';
import { auth, db } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc
} from 'firebase/firestore';

const SaaSERPPlatform = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeView, setActiveView] = useState('login');
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [tenants, setTenants] = useState([]);
  const [tenantData, setTenantData] = useState({
    customers: [],
    products: [],
    salesOrders: [],
    ledgerEntries: []
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Listen to auth state changes with timeout
  useEffect(() => {
    // Set a timeout to stop loading after 3 seconds
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(loadingTimeout);
      
      if (user) {
        setCurrentUser(user);
        await loadUserData(user);
      } else {
        setCurrentUser(null);
        setCurrentTenant(null);
        setUserRole(null);
        setActiveView('login');
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const loadUserData = async (user) => {
    try {
      if (user.email === 'superadmin@yourcompany.com') {
        setUserRole('superadmin');
        setActiveView('superadmin');
        await loadAllTenants();
        return;
      }

      const tenantDoc = await getDoc(doc(db, 'tenants', user.uid));
      if (tenantDoc.exists()) {
        const tenantInfo = { id: user.uid, ...tenantDoc.data() };
        setCurrentTenant(tenantInfo);
        setUserRole('admin');
        setActiveView('erp');
        await loadTenantData(user.uid);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadAllTenants = async () => {
    try {
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      const tenantsData = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadTenantData = async (tenantId) => {
    try {
      const customersSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'customers'));
      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const productsSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const ordersSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'salesOrders'));
      const salesOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const ledgerSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'ledgerEntries'));
      const ledgerEntries = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setTenantData({
        customers,
        products,
        salesOrders,
        ledgerEntries
      });
    } catch (error) {
      console.error('Error loading tenant data:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials: ' + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveModule('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSignup = async (companyData) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        companyData.email, 
        companyData.password
      );
      
      const userId = userCredential.user.uid;

      await setDoc(doc(db, 'tenants', userId), {
        companyName: companyData.companyName,
        email: companyData.email,
        contactName: companyData.contactName,
        plan: 'Starter',
        status: 'Trial',
        monthlyFee: 99,
        users: 1,
        createdDate: new Date().toISOString().split('T')[0],
        trialEnds: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0]
      });

      setShowModal(false);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + error.message);
      setLoading(false);
    }
  };

  const addCustomer = async (customer) => {
    try {
      const customerId = `customer_${Date.now()}`;
      await setDoc(doc(db, 'tenants', currentUser.uid, 'customers', customerId), {
        ...customer,
        status: 'Active',
        createdDate: new Date().toISOString()
      });
      await loadTenantData(currentUser.uid);
      closeModal();
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const addProduct = async (product) => {
    try {
      const productId = `product_${Date.now()}`;
      await setDoc(doc(db, 'tenants', currentUser.uid, 'products', productId), {
        ...product,
        stock: parseInt(product.stock || 0),
        price: parseFloat(product.price || 0),
        cost: parseFloat(product.cost || 0),
        createdDate: new Date().toISOString()
      });
      await loadTenantData(currentUser.uid);
      closeModal();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const addSalesOrder = async (so, items) => {
    try {
      const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
      const orderId = `order_${Date.now()}`;
      const orderNumber = `SO-${String(tenantData.salesOrders.length + 1).padStart(3, '0')}`;

      await setDoc(doc(db, 'tenants', currentUser.uid, 'salesOrders', orderId), {
        soNumber: orderNumber,
        customer: so.customer,
        date: so.date,
        total,
        status: 'Confirmed',
        items,
        createdDate: new Date().toISOString()
      });

      for (const item of items) {
        const product = tenantData.products.find(p => p.name === item.product);
        if (product) {
          await updateDoc(doc(db, 'tenants', currentUser.uid, 'products', product.id), {
            stock: product.stock - item.qty
          });
        }
      }

      const ledgerId = `ledger_${Date.now()}`;
      const lastBalance = tenantData.ledgerEntries.length > 0 
        ? tenantData.ledgerEntries[tenantData.ledgerEntries.length - 1].balance 
        : 0;

      await setDoc(doc(db, 'tenants', currentUser.uid, 'ledgerEntries', ledgerId), {
        date: new Date().toISOString().split('T')[0],
        type: 'Revenue',
        description: `Sales Order ${orderNumber}`,
        debit: 0,
        credit: total,
        balance: lastBalance + total,
        createdDate: new Date().toISOString()
      });

      await loadTenantData(currentUser.uid);
      closeModal();
    } catch (error) {
      console.error('Error adding sales order:', error);
      alert('Failed to add sales order');
    }
  };

  const updateTenantStatus = async (tenantId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), {
        status: newStatus
      });
      await loadAllTenants();
    } catch (error) {
      console.error('Error updating tenant status:', error);
    }
  };

  const upgradeTenantPlan = async (tenantId, newPlan) => {
    try {
      const planPricing = { 'Starter': 99, 'Professional': 199, 'Enterprise': 499 };
      await updateDoc(doc(db, 'tenants', tenantId), {
        plan: newPlan,
        monthlyFee: planPricing[newPlan]
      });
      await loadAllTenants();
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const superAdminStats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'Active').length,
    trialTenants: tenants.filter(t => t.status === 'Trial').length,
    totalMRR: tenants.filter(t => t.status === 'Active').reduce((sum, t) => sum + (t.monthlyFee || 0), 0),
    totalUsers: tenants.reduce((sum, t) => sum + (t.users || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl mb-4">Loading...</div>
          <div className="text-white text-sm opacity-75">Initializing your ERP system</div>
        </div>
      </div>
    );
  }

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
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  !isSuperAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Customer Login
              </button>
              <button
                onClick={() => setIsSuperAdmin(true)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
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
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin(loginEmail, loginPassword)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => handleLogin(loginEmail, loginPassword)}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white ${
                isSuperAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Logging in...' : (isSuperAdmin ? 'Login as Super Admin' : 'Login')}
            </button>

            {!isSuperAdmin && (
              <>
                <div className="text-center text-gray-500 text-sm">or</div>
                <button
                  onClick={() => openModal('signup')}
                  className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                >
                  Start Free Trial (14 Days)
                </button>
              </>
            )}

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <p className="font-medium flex items-center gap-2">
                <Check size={16} /> Firebase Connected!
              </p>
              <p className="text-xs mt-1">Real database active - data persists forever</p>
            </div>

            {isSuperAdmin && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
                <p className="font-medium">Super Admin Demo:</p>
                <p className="mt-1">Email: superadmin@yourcompany.com</p>
                <p>Password: admin123</p>
                <p className="mt-2 text-purple-600">⚠️ Create this user in Firebase Authentication first</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SuperAdminDashboard = () => (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield size={28} />
              Super Admin Dashboard
            </h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 font-medium">Total Tenants</p>
            <p className="text-3xl font-bold text-gray-800">{superAdminStats.totalTenants}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
            <p className="text-sm text-gray-600 font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600">{superAdminStats.activeTenants}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600">
            <p className="text-sm text-gray-600 font-medium">On Trial</p>
            <p className="text-3xl font-bold text-yellow-600">{superAdminStats.trialTenants}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
            <p className="text-3xl font-bold text-purple-600">${superAdminStats.totalMRR}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-600">
            <p className="text-sm text-gray-600 font-medium">Total Users</p>
            <p className="text-3xl font-bold text-indigo-600">{superAdminStats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Customer Accounts</h2>
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
              <tbody className="divide-y">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No customers yet. Users will appear here when they sign up!
                    </td>
                  </tr>
                ) : (
                  tenants.map(tenant => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{tenant.companyName}</td>
                      <td className="px-6 py-4 text-sm">{tenant.email}</td>
                      <td className="px-6 py-4">
                        <select value={tenant.plan} onChange={(e) => upgradeTenantPlan(tenant.id, e.target.value)} className="text-sm border rounded px-2 py-1">
                          <option>Starter</option>
                          <option>Professional</option>
                          <option>Enterprise</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          tenant.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">${tenant.status === 'Active' ? tenant.monthlyFee : 0}</td>
                      <td className="px-6 py-4">
                        {tenant.status === 'Trial' && (
                          <button onClick={() => updateTenantStatus(tenant.id, 'Active')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomerERP = () => {
    const modules = [
      { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
      { id: 'customers', name: 'CRM', icon: Users },
      { id: 'products', name: 'Inventory', icon: Package },
      { id: 'sales', name: 'Sales Orders', icon: FileText },
      { id: 'ledger', name: 'Ledger', icon: DollarSign }
    ];

    const stats = {
      totalRevenue: tenantData.ledgerEntries.reduce((sum, e) => sum + (e.credit || 0), 0),
      totalOrders: tenantData.salesOrders.length,
      totalProducts: tenantData.products.length,
      lowStock: tenantData.products.filter(p => p.stock < 30).length
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{currentTenant?.companyName}</h1>
              <p className="text-blue-100 text-sm">{currentTenant?.plan} Plan • {currentTenant?.status}</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="flex gap-4">
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <nav className="space-y-1">
                {modules.map(module => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                        activeModule === module.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
                  <h2 className="text-2xl font-bold">Dashboard</h2>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Sales Orders</p>
                      <p className="text-2xl font-bold text-green-900">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium">Products</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalProducts}</p>
                    </div>
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600 font-medium">Low Stock</p>
                      <p className="text-2xl font-bold text-orange-900">{stats.lowStock}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'customers' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">CRM - Customers</h2>
                    <button onClick={() => openModal('customer')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus size={20} /> Add Customer
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tenantData.customers.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No customers yet. Click "Add Customer" to get started!</td></tr>
                        ) : (
                          tenantData.customers.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                              <td className="px-6 py-4 text-sm">{c.email}</td>
                              <td className="px-6 py-4 text-sm">{c.phone}</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{c.status}</span></td>
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
                    <h2 className="text-2xl font-bold">Inventory</h2>
                    <button onClick={() => openModal('product')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus size={20} /> Add Product
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tenantData.products.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No products yet. Click "Add Product" to get started!</td></tr>
                        ) : (
                          tenantData.products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium">{p.sku}</td>
                              <td className="px-6 py-4 text-sm">{p.name}</td>
                              <td className="px-6 py-4 text-sm">{p.stock}</td>
                              <td className="px-6 py-4 text-sm">${p.price}</td>
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
                    <h2 className="text-2xl font-bold">Sales Orders</h2>
                    <button onClick={() => openModal('salesorder')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                      <Plus size={20} /> Create Order
                    </button>
                  </div>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SO #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tenantData.salesOrders.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No orders yet. Click "Create Order" to get started!</td></tr>
                        ) : (
                          tenantData.salesOrders.map(so => (
                            <tr key={so.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium">{so.soNumber}</td>
                              <td className="px-6 py-4 text-sm">{so.customer}</td>
                              <td className="px-6 py-4 text-sm">{so.date}</td>
                              <td className="px-6 py-4 text-sm">${so.total}</td>
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
                  <h2 className="text-2xl font-bold">General Ledger</h2>
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tenantData.ledgerEntries.length === 0 ? (
                          <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No entries yet</td></tr>
                        ) : (
                          tenantData.ledgerEntries.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">{e.date}</td>
                              <td className="px-6 py-4 text-sm">{e.description}</td>
                              <td className="px-6 py-4 text-sm text-right text-green-600">${e.credit}</td>
                              <td className="px-6 py-4 text-sm text-right font-medium">${e.balance}</td>
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

  const Modal = () => {
    const [items, setItems] = useState([{ product: '', qty: 0, price: 0 }]);
    
    const handleSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const formObject = Object.fromEntries(formData.entries());

      if (modalType === 'signup') handleSignup(formObject);
      else if (modalType === 'customer') addCustomer(formObject);
      else if (modalType === 'product') addProduct(formObject);
      else if (modalType === 'salesorder') addSalesOrder(formObject, items);
    };

    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {modalType === 'signup' && 'Start Free Trial'}
              {modalType === 'customer' && 'Add Customer'}
              {modalType === 'product' && 'Add Product'}
              {modalType === 'salesorder' && 'Create Sales Order'}
            </h3>
            <button onClick={closeModal} className="text-gray-500"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modalType === 'signup' && (
              <>
                <input name="companyName" placeholder="Company Name" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="contactName" placeholder="Your Name" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="password" type="password" placeholder="Password (min 6 characters)" minLength="6" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {modalType === 'customer' && (
              <>
                <input name="name" placeholder="Customer Name" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="phone" placeholder="Phone" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {modalType === 'product' && (
              <>
                <input name="name" placeholder="Product Name" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="sku" placeholder="SKU" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="stock" type="number" placeholder="Stock" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="cost" type="number" step="0.01" placeholder="Cost" required className="w-full px-4 py-2 border rounded-lg" />
                <input name="price" type="number" step="0.01" placeholder="Price" required className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}

            {modalType === 'salesorder' && (
              <>
                <select name="customer" required className="w-full px-4 py-2 border rounded-lg">
                  <option value="">Select Customer</option>
                  {tenantData.customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input name="date" type="date" required className="w-full px-4 py-2 border rounded-lg" />
                <div className="space-y-2">
                  <label className="font-medium">Items</label>
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].product = e.target.value;
                          const prod = tenantData.products.find(p => p.name === e.target.value);
                          newItems[idx].price = prod?.price || 0;
                          setItems(newItems);
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select Product</option>
                        {tenantData.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
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
                        className="w-24 px-4 py-2 border rounded-lg"
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
                        className="w-24 px-4 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => setItems([...items, { product: '', qty: 0, price: 0 }])} className="text-blue-600 text-sm">
                    + Add Item
                  </button>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                {loading ? 'Processing...' : (modalType === 'signup' ? 'Start Trial' : 'Create')}
              </button>
              <button type="button" onClick={closeModal} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
