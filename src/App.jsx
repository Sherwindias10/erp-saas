import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase.jsx';

const SaaSERPPlatform = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPassword('');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    }
  };

  const handleLogout = async () => {
    setError('');

    try {
      await signOut(auth);
    } catch (logoutError) {
      setError(logoutError.message || 'Unable to sign out.');
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading ERP platform...</div>;
  }

  if (!currentUser) {
    return (
      <main style={{ maxWidth: 420, margin: '48px auto', fontFamily: 'sans-serif' }}>
        <h1>SaaS ERP Platform</h1>
        <p>Sign in to continue.</p>
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Sign in</button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', fontFamily: 'sans-serif' }}>
      <h1>SaaS ERP Platform</h1>
      <p>Welcome, {currentUser.email}</p>
      <p>Your application is connected and ready for module integration.</p>
      <button onClick={handleLogout} type="button">
        Sign out
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </main>
  );
};

export default SaaSERPPlatform;
