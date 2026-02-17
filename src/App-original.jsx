import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  ShoppingCart, 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Eye,
  Download,
  Filter,
  MoreVertical,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { auth, db } from './firebase.jsx';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
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

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(loadingTimeout);
      
      if (user) {
        setCurrentUser(user);
        loadUserData(user).finally(() => {
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setCurrentTenant(null);
        setUserRole(null);
        setActiveView('login');
        setLoading(false);
      }
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
        loadTenantData(user.uid);
      } else {
        setActiveView('login');
        alert('Account setup is incomplete. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Error loading data: ' + error.message);
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
      const [
        customersSnapshot,
        productsSnapshot,
        ordersSnapshot,
        ledgerSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'tenants', tenantId, 'customers')),
        getDocs(collection(db, 'tenants', tenantId, 'products')),
        getDocs(collection(db, 'tenants', tenantId, 'salesOrders')),
        getDocs(collection(db, 'tenants', tenantId, 'ledgerEntries'))
      ]);

      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const salesOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ledgerEntries = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setTenantData({
        customers,
        products,
        salesOrders,
        ledgerEntries
      });
    } catch (error) {
      console.error('Error loading tenant data:', error);
      alert('Error loading data: ' + error.message);
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

  const handleSignup = async (email, password, companyName) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'tenants', user.uid), {
        companyName,
        email,
        createdAt: new Date().toISOString(),
        subscription: 'trial'
      });
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveView('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addCustomer = async (customerData) => {
    try {
      await addDoc(collection(db, 'tenants', currentTenant.id, 'customers'), {
        ...customerData,
        createdAt: new Date().toISOString()
      });
      await loadTenantData(currentTenant.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const addProduct = async (productData) => {
    try {
      await addDoc(collection(db, 'tenants', currentTenant.id, 'products'), {
        ...productData,
        createdAt: new Date().toISOString()
      });
      await loadTenantData(currentTenant.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const addSalesOrder = async (orderData) => {
    try {
      await addDoc(collection(db, 'tenants', currentTenant.id, 'salesOrders'), {
        ...orderData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      await loadTenantData(currentTenant.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding sales order:', error);
      alert('Failed to add sales order');
    }
  };

  const addLedgerEntry = async (entryData) => {
    try {
      await addDoc(collection(db, 'tenants', currentTenant.id, 'ledgerEntries'), {
        ...entryData,
        createdAt: new Date().toISOString()
      });
      await loadTenantData(currentTenant.id);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding ledger entry:', error);
      alert('Failed to add ledger entry');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        `}</style>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 absolute top-0 left-0"></div>
            <div className="w-20 h-20 rounded-full border-4 border-t-purple-500 border-r-purple-500/50 border-b-purple-500/20 border-l-transparent animate-spin"></div>
          </div>
          <p className="mt-8 text-gray-300 font-medium tracking-wide pulse-glow">Initializing Platform...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'login') {
    return <LoginView onLogin={handleLogin} onSignup={handleSignup} />;
  }

  if (activeView === 'superadmin') {
    return (
      <SuperAdminView 
        tenants={tenants} 
        onLogout={handleLogout} 
      />
    );
  }

  if (activeView === 'erp') {
    return (
      <ERPView
        currentTenant={currentTenant}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        tenantData={tenantData}
        onLogout={handleLogout}
        onAddCustomer={addCustomer}
        onAddProduct={addProduct}
        onAddSalesOrder={addSalesOrder}
        onAddLedgerEntry={addLedgerEntry}
        showModal={showModal}
        setShowModal={setShowModal}
        modalType={modalType}
        setModalType={setModalType}
      />
    );
  }

  return null;
};

// Login View Component
const LoginView = ({ onLogin, onSignup }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      if (!companyName) {
        alert('Please enter company name');
        return;
      }
      onSignup(email, password, companyName);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        
        * { font-family: 'Sora', sans-serif; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .float { animation: float 6s ease-in-out infinite; }
        .glow { animation: glow 3s ease-in-out infinite; }
        .slide-up { animation: slide-up 0.6s ease-out forwards; }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .gradient-border {
          position: relative;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        
        input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
      `}</style>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="glass-effect rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 slide-up">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg glow">
            <Building2 className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Enterprise ERP</h1>
          <p className="text-purple-200 text-sm tracking-wide">Next-Generation Business Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <div className="slide-up" style={{animationDelay: '0.1s'}}>
              <label className="block text-sm font-semibold text-purple-200 mb-2 tracking-wide">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 transition-all duration-300"
                placeholder="Enter your company name"
                required
              />
            </div>
          )}

          <div className="slide-up" style={{animationDelay: isSignup ? '0.2s' : '0.1s'}}>
            <label className="block text-sm font-semibold text-purple-200 mb-2 tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 transition-all duration-300"
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="slide-up" style={{animationDelay: isSignup ? '0.3s' : '0.2s'}}>
            <label className="block text-sm font-semibold text-purple-200 mb-2 tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 transition-all duration-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold tracking-wide hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/50 slide-up"
            style={{animationDelay: isSignup ? '0.4s' : '0.3s'}}
          >
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center slide-up" style={{animationDelay: isSignup ? '0.5s' : '0.4s'}}>
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-purple-300 hover:text-white font-medium transition-colors duration-300 tracking-wide"
          >
            {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 slide-up" style={{animationDelay: isSignup ? '0.6s' : '0.5s'}}>
          <p className="text-xs text-purple-300 text-center font-mono">
            <strong className="text-purple-200">Demo Access:</strong><br />
            superadmin@yourcompany.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

// Super Admin View Component
const SuperAdminView = ({ tenants, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Sora', sans-serif; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
      
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin</h1>
                <p className="text-sm text-gray-400">Platform Management</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10 fade-in">
          <h2 className="text-3xl font-bold text-white mb-2">Tenant Organizations</h2>
          <p className="text-gray-400">Manage all registered organizations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant, index) => (
            <div 
              key={tenant.id} 
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 border border-white/10 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 fade-in"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{tenant.companyName}</h3>
                  <p className="text-sm text-gray-400 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {tenant.email}
                  </p>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                  {tenant.subscription || 'TRIAL'}
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
                <Calendar className="w-3 h-3 mr-1" />
                Joined {new Date(tenant.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-20 fade-in">
            <div className="inline-block p-6 bg-slate-800/50 rounded-full mb-6">
              <Users className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
            </div>
            <p className="text-gray-400 text-lg">No organizations registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ERP View Component
const ERPView = ({
  currentTenant,
  activeModule,
  setActiveModule,
  tenantData,
  onLogout,
  onAddCustomer,
  onAddProduct,
  onAddSalesOrder,
  onAddLedgerEntry,
  showModal,
  setShowModal,
  modalType,
  setModalType
}) => {
  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { id: 'customers', name: 'Customers', icon: Users, color: 'from-purple-500 to-pink-500' },
    { id: 'products', name: 'Products', icon: Package, color: 'from-orange-500 to-yellow-500' },
    { id: 'sales', name: 'Sales', icon: ShoppingCart, color: 'from-green-500 to-emerald-500' },
    { id: 'accounting', name: 'Accounting', icon: BookOpen, color: 'from-indigo-500 to-purple-500' }
  ];

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        * { font-family: 'Sora', sans-serif; }
        
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-in { animation: slideIn 0.4s ease-out forwards; }
      `}</style>
      
      {/* Top Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{currentTenant?.companyName}</h1>
                <p className="text-sm text-gray-400">Enterprise Resource Planning</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900/30 backdrop-blur-xl border-r border-white/10 min-h-[calc(100vh-73px)] p-6">
          <nav className="space-y-2">
            {modules.map((module, index) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group slide-in ${
                    isActive
                      ? `bg-gradient-to-r ${module.color} text-white shadow-lg`
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                  <span className="font-semibold tracking-wide">{module.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeModule === 'dashboard' && <DashboardModule tenantData={tenantData} />}
          {activeModule === 'customers' && (
            <CustomersModule
              customers={tenantData.customers}
              onAdd={() => openModal('customer')}
            />
          )}
          {activeModule === 'products' && (
            <ProductsModule
              products={tenantData.products}
              onAdd={() => openModal('product')}
            />
          )}
          {activeModule === 'sales' && (
            <SalesModule
              orders={tenantData.salesOrders}
              onAdd={() => openModal('sales')}
            />
          )}
          {activeModule === 'accounting' && (
            <AccountingModule
              entries={tenantData.ledgerEntries}
              onAdd={() => openModal('ledger')}
            />
          )}
        </main>
      </div>

      {showModal && (
        <Modal
          type={modalType}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => {
            if (modalType === 'customer') onAddCustomer(data);
            if (modalType === 'product') onAddProduct(data);
            if (modalType === 'sales') onAddSalesOrder(data);
            if (modalType === 'ledger') onAddLedgerEntry(data);
          }}
        />
      )}
    </div>
  );
};

// Dashboard Module
const DashboardModule = ({ tenantData }) => {
  const stats = [
    { 
      label: 'Total Customers', 
      value: tenantData.customers.length, 
      icon: Users, 
      color: 'from-purple-500 to-pink-500',
      change: '+12%',
      trend: 'up'
    },
    { 
      label: 'Products', 
      value: tenantData.products.length, 
      icon: Package, 
      color: 'from-orange-500 to-yellow-500',
      change: '+5%',
      trend: 'up'
    },
    { 
      label: 'Sales Orders', 
      value: tenantData.salesOrders.length, 
      icon: ShoppingCart, 
      color: 'from-green-500 to-emerald-500',
      change: '+23%',
      trend: 'up'
    },
    { 
      label: 'Ledger Entries', 
      value: tenantData.ledgerEntries.length, 
      icon: BookOpen, 
      color: 'from-indigo-500 to-purple-500',
      change: '+8%',
      trend: 'up'
    }
  ];

  const totalRevenue = tenantData.salesOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

  return (
    <div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
      
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">Real-time business metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 fade-in-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                  stat.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
              <p className="text-4xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 fade-in-up" style={{animationDelay: '0.4s'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-300 text-sm font-semibold mb-2 tracking-wide">TOTAL REVENUE</p>
            <p className="text-5xl font-bold text-white mb-2">${totalRevenue.toLocaleString()}</p>
            <p className="text-purple-300 text-sm">Across all sales orders</p>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl">
            <DollarSign className="w-12 h-12 text-purple-300" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Customers Module
const CustomersModule = ({ customers, onAdd }) => {
  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        
        tr:hover { background: rgba(139, 92, 246, 0.05); }
      `}</style>
      
      <div className="flex justify-between items-center mb-8 fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Customers</h2>
          <p className="text-gray-400">Manage your customer relationships</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden fade-in" style={{animationDelay: '0.1s'}}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id} className="border-b border-white/5 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="text-white font-semibold">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {customers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-slate-700/30 rounded-full mb-4">
              <Users className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
            </div>
            <p className="text-gray-400 text-lg">No customers yet</p>
            <p className="text-gray-500 text-sm mt-2">Add your first customer to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Products Module
const ProductsModule = ({ products, onAdd }) => {
  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
      
      <div className="flex justify-between items-center mb-8 fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Products</h2>
          <p className="text-gray-400">Manage your product catalog</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-orange-500/50"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:transform hover:scale-105 fade-in"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl">
                <Package className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold text-white">${product.price}</p>
                <p className="text-xs text-gray-500">per unit</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-300">{product.stock} units</p>
                <p className="text-xs text-gray-500">in stock</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-16 text-center border border-white/10 fade-in">
          <div className="inline-block p-6 bg-slate-700/30 rounded-full mb-4">
            <Package className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
          </div>
          <p className="text-gray-400 text-lg">No products yet</p>
          <p className="text-gray-500 text-sm mt-2">Add your first product to start selling</p>
        </div>
      )}
    </div>
  );
};

// Sales Module
const SalesModule = ({ orders, onAdd }) => {
  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        tr:hover { background: rgba(34, 197, 94, 0.05); }
      `}</style>
      
      <div className="flex justify-between items-center mb-8 fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Sales Orders</h2>
          <p className="text-gray-400">Track and manage your sales pipeline</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
        >
          <Plus className="w-5 h-5" />
          <span>New Order</span>
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden fade-in" style={{animationDelay: '0.1s'}}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-purple-400">#{order.id.substring(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">{order.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl font-bold text-green-400">${order.amount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                      order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-slate-700/30 rounded-full mb-4">
              <ShoppingCart className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
            </div>
            <p className="text-gray-400 text-lg">No sales orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first order to start tracking sales</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Accounting Module
const AccountingModule = ({ entries, onAdd }) => {
  const totalCredit = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const totalDebit = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalCredit - totalDebit;

  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        tr:hover { background: rgba(99, 102, 241, 0.05); }
      `}</style>
      
      <div className="flex justify-between items-center mb-8 fade-in">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Accounting Ledger</h2>
          <p className="text-gray-400">Financial records and transactions</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/50"
        >
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 fade-in">
          <p className="text-green-300 text-sm font-semibold mb-2">TOTAL CREDIT</p>
          <p className="text-4xl font-bold text-white">${totalCredit.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 fade-in" style={{animationDelay: '0.1s'}}>
          <p className="text-red-300 text-sm font-semibold mb-2">TOTAL DEBIT</p>
          <p className="text-4xl font-bold text-white">${totalDebit.toLocaleString()}</p>
        </div>
        <div className={`bg-gradient-to-br backdrop-blur-xl rounded-2xl p-6 border fade-in ${
          balance >= 0 
            ? 'from-blue-900/50 to-indigo-900/50 border-blue-500/30' 
            : 'from-orange-900/50 to-red-900/50 border-orange-500/30'
        }`} style={{animationDelay: '0.2s'}}>
          <p className={`text-sm font-semibold mb-2 ${balance >= 0 ? 'text-blue-300' : 'text-orange-300'}`}>NET BALANCE</p>
          <p className="text-4xl font-bold text-white">${Math.abs(balance).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden fade-in" style={{animationDelay: '0.3s'}}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{entry.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                      entry.type === 'credit' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {entry.type.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-xl font-bold ${
                    entry.type === 'credit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.type === 'credit' ? '+' : '-'}${entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 bg-slate-700/30 rounded-full mb-4">
              <BookOpen className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
            </div>
            <p className="text-gray-400 text-lg">No ledger entries yet</p>
            <p className="text-gray-500 text-sm mt-2">Add your first transaction to start tracking finances</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ type, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getModalTitle = () => {
    switch(type) {
      case 'customer': return 'Add New Customer';
      case 'product': return 'Add New Product';
      case 'sales': return 'Create Sales Order';
      case 'ledger': return 'New Ledger Entry';
      default: return 'Add New';
    }
  };

  const getModalColor = () => {
    switch(type) {
      case 'customer': return 'from-purple-600 to-pink-600';
      case 'product': return 'from-orange-600 to-yellow-600';
      case 'sales': return 'from-green-600 to-emerald-600';
      case 'ledger': return 'from-indigo-600 to-purple-600';
      default: return 'from-blue-600 to-cyan-600';
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'customer':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="john@company.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </>
        );
      case 'product':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Product Name</label>
              <input
                type="text"
                placeholder="Product name"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea
                placeholder="Product description"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Price ($)</label>
                <input
                  type="number"
                  placeholder="99.99"
                  step="0.01"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Stock</label>
                <input
                  type="number"
                  placeholder="100"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
          </>
        );
      case 'sales':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Name</label>
              <input
                type="text"
                placeholder="Customer name"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Order Amount ($)</label>
              <input
                type="number"
                placeholder="1000.00"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
              />
            </div>
          </>
        );
      case 'ledger':
        return (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <input
                type="text"
                placeholder="Transaction description"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Transaction Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="">Select type</option>
                <option value="debit">Debit (Expense)</option>
                <option value="credit">Credit (Income)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Amount ($)</label>
              <input
                type="number"
                placeholder="500.00"
                step="0.01"
                className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-slide-up { animation: modalSlideUp 0.3s ease-out forwards; }
      `}</style>
      
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-white/10 modal-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{getModalTitle()}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {renderForm()}
          
          <div className="flex space-x-3 pt-6">
            <button
              type="submit"
              className={`flex-1 bg-gradient-to-r ${getModalColor()} text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 text-gray-300 py-3.5 rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaaSERPPlatform;
