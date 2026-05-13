import { NavLink } from 'react-router-dom';
import { FileText, BookOpen, Key, PanelLeftClose, PanelLeft } from 'lucide-react';
const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

const NAV_ITEMS = [
  { to: '/', icon: FileText, label: 'Notes' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/answer-keys', icon: Key, label: 'Answer Keys' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ background: 'var(--navy)' }}
    >
      <div className="flex items-center justify-between h-14 px-3">
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Natty On English" className="w-7 h-7 rounded-full" />
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--gold-light)' }}>
              Magical
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto p-1.5 rounded-md hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <PanelLeft size={18} />
        </button>
      )}

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Natty On English
        </div>
      )}
    </aside>
  );
}
