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
    }, 3000);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(loadingTimeout);
      
      if (user) {
        console.log('User logged in:', user.email);
        setCurrentUser(user);
        await loadUserData(user);
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
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const loadUserData = async (user) => {
    try {
      console.log('Loading user data for:', user.email);
      
      if (user.email === 'superadmin@yourcompany.com') {
        setUserRole('superadmin');
        setActiveView('superadmin');
        await loadAllTenants();
        return;
      }

      const tenantDoc = await getDoc(doc(db, 'tenants', user.uid));
      if (tenantDoc.exists()) {
        const tenantInfo = { id: user.uid, ...tenantDoc.data() };
        console.log('Loaded tenant:', tenantInfo);
        setCurrentTenant(tenantInfo);
        setUserRole('admin');
        setActiveView('erp');
        await loadTenantData(user.uid);
        loadTenantData(user.uid);
      } else {
        console.error('Tenant document not found for user:', user.uid);
        setActiveView('login');
        alert('Account setup is incomplete. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Error loading data: ' + error.message);
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
      console.log('Loaded tenants:', tenantsData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadTenantData = async (tenantId) => {
    try {
      console.log('Loading tenant data for:', tenantId);
      
      const customersSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'customers'));
      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

      const productsSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'products'));
      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const ordersSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'salesOrders'));
      const salesOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const ledgerSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'ledgerEntries'));
      const ledgerEntries = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log('Loaded data:', { customers, products, salesOrders, ledgerEntries });

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
      console.log('Attempting login for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid credentials: ' + error.message);
