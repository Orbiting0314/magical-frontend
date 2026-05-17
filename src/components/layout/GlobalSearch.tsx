import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Library, BookOpen } from 'lucide-react';
import { globalSearch } from '../../api/search';
import { noteUrl, TOPIC_NAMES } from '../../types';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    globalSearch(q).then(data => {
      const items: SearchItem[] = [];

      for (const n of data.notes) {
        items.push({
          id: `note-${n._id}`,
          title: n.title,
          subtitle: `P${n.paper} / ${TOPIC_NAMES[n.topic] || n.topic}`,
          href: noteUrl(n),
          icon: FileText,
          group: 'Notes',
        });
      }

      for (const s of data.sources) {
        items.push({
          id: `source-${s._id}`,
          title: s.title,
          subtitle: [s.type, s.paper ? `P${s.paper}` : ''].filter(Boolean).join(' / '),
          href: `/sources/${s._id}`,
          icon: Library,
          group: 'Sources',
        });
      }

      for (const c of data.components) {
        items.push({
          id: `comp-${c._id}`,
          title: c.name,
          subtitle: [c.type, c.paper ? `P${c.paper}` : '', c.topic ? (TOPIC_NAMES[c.topic] || c.topic) : ''].filter(Boolean).join(' / '),
          href: `/knowledge/${c._id}`,
          icon: BookOpen,
          group: 'Components',
        });
      }

      setResults(items);
      setActiveIdx(0);
    }).catch(() => {
      setResults([]);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  function go(href: string) {
    setOpen(false);
    navigate(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      go(results[activeIdx].href);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  if (!open) return null;

  const groups: { label: string; items: (SearchItem & { idx: number })[] }[] = [];
  let idx = 0;
  const grouped: Record<string, (SearchItem & { idx: number })[]> = {};
  for (const item of results) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push({ ...item, idx });
    idx++;
  }
  for (const label of ['Notes', 'Sources', 'Components']) {
    if (grouped[label]?.length) groups.push({ label, items: grouped[label] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border overflow-hidden" style={{ borderColor: '#f0e8e0' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#f0e8e0' }}>
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, sources, components..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 border border-gray-200 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
          )}

          {!loading && groups.map(({ label, items }) => (
            <div key={label}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider" style={{ background: 'var(--cream)' }}>
                {label}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIdx(item.idx)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      item.idx === activeIdx ? '' : 'hover:bg-gray-50'
                    }`}
                    style={item.idx === activeIdx ? { background: 'var(--pink-light)' } : undefined}
                  >
                    <Icon size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--navy)' }}>{item.title}</div>
                      <div className="text-[11px] text-gray-400 truncate">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t text-[10px] text-gray-400 flex items-center gap-4" style={{ borderColor: '#f0e8e0' }}>
          <span>Up/Down to navigate</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-nav-item ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Search size={18} />
      {!collapsed && (
        <>
          <span className="flex-1">Search</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 border border-gray-200 rounded">
            {navigator.platform?.toUpperCase().includes('MAC') ? 'Cmd' : 'Ctrl'}+K
          </kbd>
        </>
      )}
    </button>
  );
}
