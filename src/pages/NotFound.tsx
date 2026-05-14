import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <img
        src={`${import.meta.env.BASE_URL}magical-logo.png`}
        alt="Magical"
        className="w-32 h-32 object-contain mb-4 opacity-60"
      />
      <div
        className="text-5xl font-bold mb-2"
        style={{ color: 'var(--pink)', fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        404
      </div>
      <p className="text-lg mb-1" style={{ color: 'var(--navy)' }}>Page not found</p>
      <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--navy-light)' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--pink-light)', color: 'var(--navy-light)' }}
        >
          <ArrowLeft size={15} />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-pink flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Home size={15} />
          Dashboard
        </button>
      </div>
    </div>
  );
}
