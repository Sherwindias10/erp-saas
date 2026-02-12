import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  DollarSign,
  FileText,
  LogOut,
  Package,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase.jsx';

const baseCard = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#fff',
  padding: 16,
};

const SaaSERPPlatform = () => {
  const [authState, setAuthState] = useState({ email: '', password: '' });
  const [signupState, setSignupState] = useState({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [userRole, setUserRole] = useState('tenant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dashboard');
  const [showSignup, setShowSignup] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [tenantData, setTenantData] = useState({
    customers: [],
    products: [],
    salesOrders: [],
    ledgerEntries: [],
  });

  const [draftCustomer, setDraftCustomer] = useState({ name: '', email: '', phone: '' });
  const [draftProduct, setDraftProduct] = useState({ name: '', sku: '', stock: '', price: '' });
  const [draftOrder, setDraftOrder] = useState({ customer: '', total: '', date: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError('');
      setCurrentUser(user);

      if (!user) {
        setCurrentTenant(null);
        setUserRole('tenant');
        setLoading(false);
        return;
      }

      try {
        if (user.email === 'superadmin@yourcompany.com') {
          setUserRole('superadmin');
          const allTenants = await getDocs(collection(db, 'tenants'));
          setTenants(allTenants.docs.map((tenantDoc) => ({ id: tenantDoc.id, ...tenantDoc.data() })));
          setLoading(false);
          return;
        }

        setUserRole('tenant');
        const tenantDoc = await getDoc(doc(db, 'tenants', user.uid));
        if (!tenantDoc.exists()) {
          setError('Tenant profile not found. Please contact support.');
          setCurrentTenant(null);
          setLoading(false);
          return;
        }

        const tenant = { id: tenantDoc.id, ...tenantDoc.data() };
        setCurrentTenant(tenant);

        const [customers, products, salesOrders, ledgerEntries] = await Promise.all([
          getDocs(collection(db, 'tenants', user.uid, 'customers')),
          getDocs(collection(db, 'tenants', user.uid, 'products')),
          getDocs(collection(db, 'tenants', user.uid, 'salesOrders')),
          getDocs(collection(db, 'tenants', user.uid, 'ledgerEntries')),
        ]);

        setTenantData({
          customers: customers.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
          products: products.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
          salesOrders: salesOrders.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
          ledgerEntries: ledgerEntries.docs.map((entry) => ({ id: entry.id, ...entry.data() })),
        });
      } catch (loadError) {
        setError(loadError.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const revenue = tenantData.salesOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return [
      { icon: Users, label: 'Customers', value: tenantData.customers.length },
      { icon: Package, label: 'Products', value: tenantData.products.length },
      { icon: FileText, label: 'Sales Orders', value: tenantData.salesOrders.length },
      { icon: DollarSign, label: 'Revenue', value: `$${revenue.toLocaleString()}` },
    ];
  }, [tenantData]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, authState.email, authState.password);
      setAuthState({ email: '', password: '' });
    } catch (loginError) {
      setError(loginError.message || 'Invalid credentials.');
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, signupState.email, signupState.password);
      await setDoc(doc(db, 'tenants', userCred.user.uid), {
        companyName: signupState.companyName,
        contactName: signupState.contactName,
        email: signupState.email,
        createdAt: new Date().toISOString(),
        plan: 'starter',
      });
      setShowSignup(false);
      setSignupState({ companyName: '', contactName: '', email: '', password: '' });
    } catch (signupError) {
      setError(signupError.message || 'Failed to create account.');
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (logoutError) {
      setError(logoutError.message || 'Logout failed.');
    }
  };

  const insertTenantDoc = async (collectionName, payload) => {
    if (!currentUser) return;
    const id = `${collectionName}_${Date.now()}`;
    await setDoc(doc(db, 'tenants', currentUser.uid, collectionName, id), {
      ...payload,
      createdAt: new Date().toISOString(),
    });
  };

  const addCustomer = async (event) => {
    event.preventDefault();
    await insertTenantDoc('customers', draftCustomer);
    setTenantData((prev) => ({ ...prev, customers: [...prev.customers, { id: `customers_${Date.now()}`, ...draftCustomer }] }));
    setDraftCustomer({ name: '', email: '', phone: '' });
  };

  const addProduct = async (event) => {
    event.preventDefault();
    const payload = {
      ...draftProduct,
      stock: Number(draftProduct.stock || 0),
      price: Number(draftProduct.price || 0),
    };
    await insertTenantDoc('products', payload);
    setTenantData((prev) => ({ ...prev, products: [...prev.products, { id: `products_${Date.now()}`, ...payload }] }));
    setDraftProduct({ name: '', sku: '', stock: '', price: '' });
  };

  const addSalesOrder = async (event) => {
    event.preventDefault();
    const payload = {
      customer: draftOrder.customer,
      total: Number(draftOrder.total || 0),
      date: draftOrder.date,
      status: 'Draft',
    };
    await insertTenantDoc('salesOrders', payload);
    setTenantData((prev) => ({ ...prev, salesOrders: [...prev.salesOrders, { id: `salesOrders_${Date.now()}`, ...payload }] }));
    setDraftOrder({ customer: '', total: '', date: '' });
  };

  if (loading) {
    return <main style={{ padding: 24, fontFamily: 'sans-serif' }}>Loading SaaS ERP Platform…</main>;
  }

  if (!currentUser) {
    return (
      <main style={{ maxWidth: 480, margin: '48px auto', fontFamily: 'sans-serif', padding: '0 12px' }}>
        <div style={baseCard}>
          <h1 style={{ marginTop: 0 }}>SaaS ERP Platform</h1>
          <p>Sign in to access your tenant workspace.</p>
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: 10 }}>
            <input
              placeholder="Email"
              type="email"
              value={authState.email}
              onChange={(event) => setAuthState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              placeholder="Password"
              type="password"
              value={authState.password}
              onChange={(event) => setAuthState((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button type="submit">Sign in</button>
          </form>
          <button type="button" onClick={() => setShowSignup((prev) => !prev)} style={{ marginTop: 10 }}>
            {showSignup ? 'Hide sign up' : 'Start free trial'}
          </button>
          {showSignup && (
            <form onSubmit={handleSignup} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <input
                placeholder="Company name"
                value={signupState.companyName}
                onChange={(event) => setSignupState((prev) => ({ ...prev, companyName: event.target.value }))}
                required
              />
              <input
                placeholder="Contact name"
                value={signupState.contactName}
                onChange={(event) => setSignupState((prev) => ({ ...prev, contactName: event.target.value }))}
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={signupState.email}
                onChange={(event) => setSignupState((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                placeholder="Password"
                type="password"
                value={signupState.password}
                onChange={(event) => setSignupState((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              <button type="submit">Create account</button>
            </form>
          )}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
      </main>
    );
  }

  if (userRole === 'superadmin') {
    return (
      <main style={{ maxWidth: 900, margin: '30px auto', fontFamily: 'sans-serif', padding: '0 12px' }}>
        <div style={{ ...baseCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>Super Admin</h1>
            <p style={{ margin: '6px 0 0 0' }}>Manage all tenant organizations.</p>
          </div>
          <button onClick={handleLogout} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
        <section style={{ ...baseCard, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>Tenants ({tenants.length})</h2>
          <ul>
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                {tenant.companyName || tenant.email || tenant.id} · {tenant.plan || 'n/a'}
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '24px auto', fontFamily: 'sans-serif', padding: '0 12px' }}>
      <header style={{ ...baseCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>SaaS ERP Platform</h1>
          <p style={{ margin: '6px 0 0 0' }}>
            <Building2 size={16} style={{ verticalAlign: 'text-bottom' }} /> {currentTenant?.companyName || currentUser.email}
          </p>
        </div>
        <button onClick={handleLogout} type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {['dashboard', 'customers', 'products', 'orders'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setView(item)}
            style={{
              textTransform: 'capitalize',
              background: view === item ? '#111827' : '#f3f4f6',
              color: view === item ? '#fff' : '#111827',
              borderRadius: 8,
              padding: '8px 12px',
              border: 'none',
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {view === 'dashboard' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} style={baseCard}>
                <p style={{ margin: 0, color: '#6b7280' }}>
                  <Icon size={16} style={{ verticalAlign: 'text-bottom' }} /> {metric.label}
                </p>
                <h3 style={{ marginBottom: 0 }}>{metric.value}</h3>
              </article>
            );
          })}
          <article style={baseCard}>
            <p style={{ margin: 0, color: '#6b7280' }}>
              <TrendingUp size={16} style={{ verticalAlign: 'text-bottom' }} /> Business Health
            </p>
            <h3 style={{ marginBottom: 0 }}>Stable</h3>
          </article>
        </section>
      )}

      {view === 'customers' && (
        <section style={{ ...baseCard, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>Customers</h2>
          <form onSubmit={addCustomer} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input placeholder="Name" value={draftCustomer.name} onChange={(e) => setDraftCustomer((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder="Email" type="email" value={draftCustomer.email} onChange={(e) => setDraftCustomer((p) => ({ ...p, email: e.target.value }))} required />
            <input placeholder="Phone" value={draftCustomer.phone} onChange={(e) => setDraftCustomer((p) => ({ ...p, phone: e.target.value }))} required />
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Add</button>
          </form>
          <ul>
            {tenantData.customers.map((customer) => (
              <li key={customer.id}>{customer.name} · {customer.email}</li>
            ))}
          </ul>
        </section>
      )}

      {view === 'products' && (
        <section style={{ ...baseCard, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>Products</h2>
          <form onSubmit={addProduct} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input placeholder="Name" value={draftProduct.name} onChange={(e) => setDraftProduct((p) => ({ ...p, name: e.target.value }))} required />
            <input placeholder="SKU" value={draftProduct.sku} onChange={(e) => setDraftProduct((p) => ({ ...p, sku: e.target.value }))} required />
            <input placeholder="Stock" type="number" value={draftProduct.stock} onChange={(e) => setDraftProduct((p) => ({ ...p, stock: e.target.value }))} required />
            <input placeholder="Price" type="number" step="0.01" value={draftProduct.price} onChange={(e) => setDraftProduct((p) => ({ ...p, price: e.target.value }))} required />
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Add</button>
          </form>
          <ul>
            {tenantData.products.map((product) => (
              <li key={product.id}>{product.name} · {product.sku} · ${Number(product.price || 0).toFixed(2)}</li>
            ))}
          </ul>
        </section>
      )}

      {view === 'orders' && (
        <section style={{ ...baseCard, marginTop: 12 }}>
          <h2 style={{ marginTop: 0 }}>Sales Orders</h2>
          <form onSubmit={addSalesOrder} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input placeholder="Customer" value={draftOrder.customer} onChange={(e) => setDraftOrder((p) => ({ ...p, customer: e.target.value }))} required />
            <input placeholder="Total" type="number" step="0.01" value={draftOrder.total} onChange={(e) => setDraftOrder((p) => ({ ...p, total: e.target.value }))} required />
            <input type="date" value={draftOrder.date} onChange={(e) => setDraftOrder((p) => ({ ...p, date: e.target.value }))} required />
            <button type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Create</button>
          </form>
          <ul>
            {tenantData.salesOrders.map((order) => (
              <li key={order.id}>{order.customer} · ${Number(order.total || 0).toFixed(2)} · {order.date}</li>
            ))}
          </ul>
        </section>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
};

export default SaaSERPPlatform;
