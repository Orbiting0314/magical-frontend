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
    <div className="min-h-screen flex">
      {/* Left: background image */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center"
        style={{
          background: `var(--pink-light) url(${fullLogo}) no-repeat center center`,
          backgroundSize: '60%',
        }}
      />

      {/* Right: login form */}
      <div
        className="w-full md:w-1/2 flex items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div className="w-full max-w-sm px-6">
          <div className="text-center mb-8">
            <img
              src={fullLogo}
              alt="Magical"
              className="w-32 h-32 mx-auto object-contain md:hidden"
            />
            <h1
              className="text-3xl font-semibold tracking-widest mt-2 uppercase"
              style={{ color: 'var(--pink-dark)', fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              MAGICAL
            </h1>
            <p
              className="mt-1 text-sm tracking-wider uppercase"
              style={{ color: 'var(--navy-light)' }}
            >
              NOTES BY MISS ON
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl shadow-lg p-8 space-y-5"
            style={{ background: 'white', border: '1px solid #f0e8e0' }}
          >
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 uppercase tracking-wide" style={{ color: 'var(--navy)' }}>
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
              className="btn-pink w-full py-2.5 rounded-lg text-sm font-medium uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
