import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
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
