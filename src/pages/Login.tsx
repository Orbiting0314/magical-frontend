import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const fullLogo = `${import.meta.env.BASE_URL}magical-logo.png`;

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid password');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img
            src={fullLogo}
            alt="Magical - notes by miss on"
            className="w-44 h-44 mx-auto object-contain"
          />
          <h1
            className="text-3xl font-semibold tracking-tight mt-2"
            style={{ color: 'var(--pink-dark)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            magical
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--navy-light)' }}>
            notes by miss on
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl shadow-lg p-8 space-y-5"
          style={{ background: 'white', border: '1px solid #f0e8e0' }}
        >
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--navy)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ border: '1px solid var(--pink-light)' }}
              placeholder="Enter password"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="btn-pink w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
