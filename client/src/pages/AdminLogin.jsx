import { useState } from 'react';
import { getValidApiUrl } from '../services/urlService';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const API_URL = await getValidApiUrl();
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        window.location.href = '/'; //Home redirect
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <main className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <article>
        <h2>Admin Access</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </article>
    </main>
  );
}