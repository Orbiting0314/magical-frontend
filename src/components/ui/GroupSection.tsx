import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function GroupSection({ title, count, children, defaultOpen = false }: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-5 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
        <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>{title}</span>
        <span className="text-xs text-gray-400 ml-1">({count})</span>
      </button>
      {open && children}
    </div>
  );
}
