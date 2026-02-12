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
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase.jsx';
import './App.css';

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
    return <main className="app-shell"><div className="loading-card">Loading SaaS ERP Platform…</div></main>;
  }

  if (!currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>SaaS ERP Platform</h1>
          <p className="muted">Sign in to access your tenant workspace.</p>

          <form onSubmit={handleLogin} className="stack-form">
            <input
              className="ui-input"
              placeholder="Email"
              type="email"
              value={authState.email}
              onChange={(event) => setAuthState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <input
              className="ui-input"
              placeholder="Password"
              type="password"
              value={authState.password}
              onChange={(event) => setAuthState((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <button className="ui-button" type="submit">Sign in</button>
          </form>

          <button className="ui-button ghost" type="button" onClick={() => setShowSignup((prev) => !prev)}>
            {showSignup ? 'Hide sign up' : 'Start free trial'}
          </button>

          {showSignup && (
            <form onSubmit={handleSignup} className="stack-form signup-form">
              <input className="ui-input" placeholder="Company name" value={signupState.companyName} onChange={(event) => setSignupState((prev) => ({ ...prev, companyName: event.target.value }))} required />
              <input className="ui-input" placeholder="Contact name" value={signupState.contactName} onChange={(event) => setSignupState((prev) => ({ ...prev, contactName: event.target.value }))} required />
              <input className="ui-input" placeholder="Email" type="email" value={signupState.email} onChange={(event) => setSignupState((prev) => ({ ...prev, email: event.target.value }))} required />
              <input className="ui-input" placeholder="Password" type="password" value={signupState.password} onChange={(event) => setSignupState((prev) => ({ ...prev, password: event.target.value }))} required />
              <button className="ui-button" type="submit">Create account</button>
            </form>
          )}

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  if (userRole === 'superadmin') {
    return (
      <main className="app-shell">
        <header className="top-card">
          <div>
            <h1>Super Admin</h1>
            <p className="muted">Manage all tenant organizations.</p>
          </div>
          <button className="ui-button danger" onClick={handleLogout} type="button"><LogOut size={16} /> Sign out</button>
        </header>

        <section className="content-card">
          <h2>Tenants ({tenants.length})</h2>
          {tenants.length === 0 ? (
            <p className="muted">No tenants available yet.</p>
          ) : (
            <ul className="entity-list">
              {tenants.map((tenant) => (
                <li key={tenant.id}>
                  <strong>{tenant.companyName || tenant.email || tenant.id}</strong>
                  <span>{tenant.plan || 'n/a'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-card">
        <div>
          <h1>SaaS ERP Platform</h1>
          <p className="muted"><Building2 size={16} /> {currentTenant?.companyName || currentUser.email}</p>
        </div>
        <button className="ui-button danger" onClick={handleLogout} type="button"><LogOut size={16} /> Sign out</button>
      </header>

      <nav className="tab-nav">
        {['dashboard', 'customers', 'products', 'orders'].map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} className={`tab-btn ${view === item ? 'active' : ''}`}>
            {item}
          </button>
        ))}
      </nav>

      {view === 'dashboard' && (
        <section className="metrics-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="metric-card">
                <p className="muted"><Icon size={16} /> {metric.label}</p>
                <h3>{metric.value}</h3>
              </article>
            );
          })}
          <article className="metric-card">
            <p className="muted"><TrendingUp size={16} /> Business Health</p>
            <h3>Stable</h3>
          </article>
        </section>
      )}

      {view === 'customers' && (
        <section className="content-card">
          <h2>Customers</h2>
          <form onSubmit={addCustomer} className="row-form">
            <input className="ui-input" placeholder="Name" value={draftCustomer.name} onChange={(e) => setDraftCustomer((p) => ({ ...p, name: e.target.value }))} required />
            <input className="ui-input" placeholder="Email" type="email" value={draftCustomer.email} onChange={(e) => setDraftCustomer((p) => ({ ...p, email: e.target.value }))} required />
            <input className="ui-input" placeholder="Phone" value={draftCustomer.phone} onChange={(e) => setDraftCustomer((p) => ({ ...p, phone: e.target.value }))} required />
            <button className="ui-button" type="submit"><Plus size={14} /> Add</button>
          </form>

          {tenantData.customers.length === 0 ? <p className="muted">No customers yet.</p> : (
            <ul className="entity-list">
              {tenantData.customers.map((customer) => (
                <li key={customer.id}><strong>{customer.name}</strong><span>{customer.email}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {view === 'products' && (
        <section className="content-card">
          <h2>Products</h2>
          <form onSubmit={addProduct} className="row-form">
            <input className="ui-input" placeholder="Name" value={draftProduct.name} onChange={(e) => setDraftProduct((p) => ({ ...p, name: e.target.value }))} required />
            <input className="ui-input" placeholder="SKU" value={draftProduct.sku} onChange={(e) => setDraftProduct((p) => ({ ...p, sku: e.target.value }))} required />
            <input className="ui-input" placeholder="Stock" type="number" value={draftProduct.stock} onChange={(e) => setDraftProduct((p) => ({ ...p, stock: e.target.value }))} required />
            <input className="ui-input" placeholder="Price" type="number" step="0.01" value={draftProduct.price} onChange={(e) => setDraftProduct((p) => ({ ...p, price: e.target.value }))} required />
            <button className="ui-button" type="submit"><Plus size={14} /> Add</button>
          </form>

          {tenantData.products.length === 0 ? <p className="muted">No products yet.</p> : (
            <ul className="entity-list">
              {tenantData.products.map((product) => (
                <li key={product.id}><strong>{product.name}</strong><span>{product.sku} · ${Number(product.price || 0).toFixed(2)}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {view === 'orders' && (
        <section className="content-card">
          <h2>Sales Orders</h2>
          <form onSubmit={addSalesOrder} className="row-form">
            <input className="ui-input" placeholder="Customer" value={draftOrder.customer} onChange={(e) => setDraftOrder((p) => ({ ...p, customer: e.target.value }))} required />
            <input className="ui-input" placeholder="Total" type="number" step="0.01" value={draftOrder.total} onChange={(e) => setDraftOrder((p) => ({ ...p, total: e.target.value }))} required />
            <input className="ui-input" type="date" value={draftOrder.date} onChange={(e) => setDraftOrder((p) => ({ ...p, date: e.target.value }))} required />
            <button className="ui-button" type="submit"><Plus size={14} /> Create</button>
          </form>

          {tenantData.salesOrders.length === 0 ? <p className="muted">No sales orders yet.</p> : (
            <ul className="entity-list">
              {tenantData.salesOrders.map((order) => (
                <li key={order.id}><strong>{order.customer}</strong><span>${Number(order.total || 0).toFixed(2)} · {order.date}</span></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && <p className="error-text">{error}</p>}
    </main>
  );
};

export default SaaSERPPlatform;
