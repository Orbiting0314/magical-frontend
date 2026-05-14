import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(true);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          success: { duration: 3000 },
          error: { duration: 5000 },
          style: {
            background: '#fffaf5',
            color: '#1e293b',
            border: '1px solid #f0e8e0',
            fontSize: '0.875rem',
          },
        }}
      />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-200"
        style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
      >
        <header
          className="h-14 flex items-center justify-end px-6 border-b"
          style={{ background: 'white', borderColor: '#f0e8e0' }}
        >
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--navy-light)' }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
