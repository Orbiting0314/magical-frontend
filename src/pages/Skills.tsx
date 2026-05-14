import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marked } from 'marked';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getSkills } from '../api/skills';
import type { ChangelogEntry } from '../api/skills';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const re = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
    items.push({ id, text, level });
  }
  return items;
}

function injectHeadingIds(html: string, toc: TocItem[]): string {
  let result = html;
  for (const item of toc) {
    const escaped = item.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(<h[23][^>]*>)(${escaped})(</h[23]>)`, 'i');
    result = result.replace(re, `$1<span id="${item.id}"></span>$2$3`);
  }
  return result;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACTOR_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  mcp: { label: 'AI', bg: '#ede9fe', color: 'var(--purple)' },
  admin: { label: 'Admin', bg: 'var(--gold-light)', color: 'var(--gold-dark)' },
  natty: { label: 'Natty', bg: 'var(--pink-light)', color: 'var(--pink-dark)' },
  system: { label: 'System', bg: '#f3f4f6', color: '#6b7280' },
};

export default function Skills() {
  const { data, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
  });

  const [activeId, setActiveId] = useState('');
  const [changelogOpen, setChangelogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toc = useMemo(() => (data?.content ? extractToc(data.content) : []), [data?.content]);

  const renderedHtml = useMemo(() => {
    if (!data?.content) return '';
    const raw = marked.parse(data.content, { async: false }) as string;
    return injectHeadingIds(raw, toc);
  }, [data?.content, toc]);

  useEffect(() => {
    if (!toc.length || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    for (const item of toc) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [toc, renderedHtml]);

  if (isLoading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Loading Teaching DNA...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Skills document not found.</p>
        <p className="text-xs text-gray-300 mt-1">Run the seed script to import skills.md.</p>
      </div>
    );
  }

  const actorCfg = ACTOR_LABELS[data.lastUpdatedBy] || ACTOR_LABELS.system;

  return (
    <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Sticky TOC sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20">
          <h2
            className="text-sm font-bold mb-3 tracking-wide"
            style={{ color: 'var(--navy)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Teaching DNA
          </h2>
          <nav className="space-y-0.5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="block text-xs py-1 rounded transition-colors truncate"
                style={{
                  paddingLeft: item.level === 3 ? '1rem' : '0.25rem',
                  color: activeId === item.id ? 'var(--pink-dark)' : 'var(--navy-light)',
                  fontWeight: activeId === item.id ? 600 : 400,
                  background: activeId === item.id ? 'var(--pink-light)' : undefined,
                }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Version badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--navy)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Teaching DNA
          </h1>
          <span className="tag-pill" style={{ background: actorCfg.bg, color: actorCfg.color }}>
            v{data.version}
          </span>
          <span className="text-xs text-gray-400">
            Last updated {relativeTime(data.updatedAt)} by {actorCfg.label}
          </span>
        </div>

        {/* Rendered content */}
        <div className="card" ref={contentRef}>
          <div
            className="md-content px-6 py-5"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>

        {/* Changelog */}
        {data.changelog.length > 0 && (
          <div className="card">
            <button
              onClick={() => setChangelogOpen(!changelogOpen)}
              className="flex items-center gap-2 w-full px-5 py-3 text-left text-sm font-medium"
              style={{ color: 'var(--navy)' }}
            >
              {changelogOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Version History ({data.changelog.length})
            </button>
            {changelogOpen && (
              <div className="px-5 pb-4 space-y-2">
                {data.changelog.map((entry: ChangelogEntry) => {
                  const cfg = ACTOR_LABELS[entry.updatedBy] || ACTOR_LABELS.system;
                  return (
                    <div
                      key={entry._id}
                      className="flex items-start gap-3 py-2 border-t"
                      style={{ borderColor: '#f8f0ea' }}
                    >
                      <span className="text-xs font-mono font-semibold shrink-0" style={{ color: 'var(--navy-light)' }}>
                        v{entry.version}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-600 flex-1">{entry.summary || 'No description'}</span>
                      <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                        {relativeTime(entry.updatedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
