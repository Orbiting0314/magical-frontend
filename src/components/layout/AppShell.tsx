import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-200"
        style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
      >
        <header className="h-14 flex items-center justify-end px-6 border-b border-gray-200 bg-white">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
