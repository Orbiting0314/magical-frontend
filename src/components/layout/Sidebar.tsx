import { NavLink } from 'react-router-dom';
import { FileText, BookOpen, Key, Library, Clock, PanelLeftClose, PanelLeft } from 'lucide-react';

const fullLogo = `${import.meta.env.BASE_URL}magical-logo.png`;

const NAV_ITEMS = [
  { to: '/', icon: FileText, label: 'Notes' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/answer-keys', icon: Key, label: 'Answer Keys' },
  { to: '/sources', icon: Library, label: 'Sources' },
  { to: '/activity', icon: Clock, label: 'Activity' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col transition-all duration-200 z-30 border-r ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ background: 'white', borderColor: '#f0e8e0' }}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between px-3" style={{ height: collapsed ? '3.5rem' : 'auto', paddingTop: collapsed ? 0 : '0.75rem' }}>
        <div className="flex items-center gap-2">
          {collapsed ? (
            <img src={fullLogo} alt="Magical" className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div className="flex flex-col items-center w-full py-2">
              <img src={fullLogo} alt="Magical" className="w-28 h-28 object-contain" />
              <span
                className="text-lg font-semibold tracking-tight mt-1"
                style={{ color: 'var(--pink-dark)', fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                magical
              </span>
              <span className="text-[10px] tracking-wide" style={{ color: 'var(--navy-light)' }}>
                notes by miss on
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="absolute top-3 right-3 p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--navy-light)' }}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto p-1.5 rounded-md transition-colors mt-1"
          style={{ color: 'var(--navy-light)' }}
        >
          <PanelLeft size={16} />
        </button>
      )}

      {/* Divider */}
      {!collapsed && (
        <div className="mx-4 my-2 border-t" style={{ borderColor: 'var(--pink-light)' }} />
      )}

      <nav className="flex-1 px-2 py-2 space-y-0.5">
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
        <div className="px-4 py-3 text-[10px] tracking-wide" style={{ color: 'var(--pink-dark)', opacity: 0.5 }}>
          Natty On English
        </div>
      )}
    </aside>
  );
}
