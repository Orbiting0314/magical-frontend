import { useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, FileDown, FileText, Globe, Image, X, FileStack } from 'lucide-react';
import { getSources, getSourceTags } from '../api/sources';
import { SOURCE_TYPES, SOURCE_FORMATS, EXTRACTED_STATUS_OPTIONS } from '../types';
import type { SourceListItem } from '../types';
import Pagination from '../components/ui/Pagination';
import GroupSection from '../components/ui/GroupSection';

const SRC_PAGE_SIZE = 25;

const FORMAT_ICONS: Record<string, React.ElementType> = {
  pdf: FileDown,
  text: FileText,
  markdown: FileText,
  image: Image,
  url: Globe,
};

const TYPE_COLORS: Record<string, string> = {
  'past-paper': 'bg-blue-100 text-blue-800',
  'past-paper-text': 'bg-amber-100 text-amber-800',
  'answer-key': 'bg-orange-100 text-orange-800',
  'candidate-sample': 'bg-purple-100 text-purple-800',
  'exam-report': 'bg-indigo-100 text-indigo-800',
  'assessment-guide': 'bg-violet-100 text-violet-800',
  'tutorial': 'bg-emerald-100 text-emerald-800',
  'school-reference': 'bg-teal-100 text-teal-800',
  'teaching-note': 'bg-cyan-100 text-cyan-800',
};

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SOURCE_TYPES.filter(t => t.value !== 'all').map(t => [t.value, t.label])
);

const TAG_COLORS: Record<string, string> = {
  'official': 'bg-blue-50 text-blue-700 border-blue-200',
  'third-party': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'internal': 'bg-violet-50 text-violet-700 border-violet-200',
  'question-types': 'bg-rose-50 text-rose-700 border-rose-200',
  'text-types': 'bg-blue-50 text-blue-700 border-blue-200',
  'strategies': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'sample-essays': 'bg-purple-50 text-purple-700 border-purple-200',
  'sample-answers': 'bg-purple-50 text-purple-700 border-purple-200',
  'grading': 'bg-amber-50 text-amber-700 border-amber-200',
  'topics': 'bg-teal-50 text-teal-700 border-teal-200',
  'topics-by-year': 'bg-teal-50 text-teal-700 border-teal-200',
  'sentence-patterns': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'exam-data': 'bg-orange-50 text-orange-700 border-orange-200',
  'syllabus': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'vocabulary': 'bg-pink-50 text-pink-700 border-pink-200',
  'past-paper': 'bg-gray-50 text-gray-700 border-gray-200',
  'answers': 'bg-orange-50 text-orange-700 border-orange-200',
  'examiner-commentary': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'teaching-notes': 'bg-violet-50 text-violet-700 border-violet-200',
  'school': 'bg-teal-50 text-teal-700 border-teal-200',
};

function formatBytes(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractDomain(origin: string | null | undefined): string {
  if (!origin) return '-';
  try {
    if (origin.startsWith('http')) return new URL(origin).hostname.replace(/^www\./, '');
    return origin;
  } catch { return origin; }
}

function TagChip({ tag, small }: { tag: string; small?: boolean }) {
  const colors = TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-200';
  const size = small ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]';
  return <span className={`inline-block ${size} font-medium rounded border ${colors}`}>{tag}</span>;
}

function SourceRow({ s, onClick }: { s: SourceListItem; onClick: () => void }) {
  const FormatIcon = FORMAT_ICONS[s.format] || FileText;
  const displayTags = (s.tags || []).slice(0, 3);
  const overflow = (s.tags || []).length - 3;

  return (
    <tr className="border-b cursor-pointer transition-colors" style={{ borderColor: '#f8f0ea' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink-light)')} onMouseLeave={(e) => (e.currentTarget.style.background = '')} onClick={onClick}>
      <td className="px-5 py-3 max-w-xs">
        <div className="font-medium truncate" style={{ color: 'var(--navy)' }}>{s.title}</div>
        {s.snippet && (
          <div className="text-[11px] text-gray-400 truncate mt-0.5">{s.snippet}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[s.type] || 'bg-gray-100 text-gray-700'}`}>
          {TYPE_LABELS[s.type] || s.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-gray-600">
          <FormatIcon size={14} />
          {s.format}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">{s.paper ? `P${s.paper}` : '-'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-0.5">
          {displayTags.map(t => <TagChip key={t} tag={t} small />)}
          {overflow > 0 && <span className="text-[9px] text-gray-400 self-center">+{overflow}</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        {s.noteCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <FileStack size={12} />
            {s.noteCount}
          </span>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{formatBytes(s.originalFileSize)}</td>
    </tr>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
        <th className="px-5 py-2.5">Title</th>
        <th className="px-4 py-2.5">Type</th>
        <th className="px-4 py-2.5">Format</th>
        <th className="px-4 py-2.5">Paper</th>
        <th className="px-4 py-2.5">Tags</th>
        <th className="px-4 py-2.5">Notes</th>
        <th className="px-4 py-2.5">Size</th>
      </tr>
    </thead>
  );
}

function useUrlFilter(key: string, defaultVal: string): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) || defaultVal;
  const set = useCallback((v: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (v === defaultVal) next.delete(key);
      else next.set(key, v);
      return next;
    }, { replace: true });
  }, [key, defaultVal, setParams]);
  return [value, set];
}

export default function Sources() {
  const navigate = useNavigate();
  const [search, setSearch] = useUrlFilter('q', '');
  const [typeFilter, setTypeFilter] = useUrlFilter('type', 'all');
  const [formatFilter, setFormatFilter] = useUrlFilter('format', 'all');
  const [statusFilter, setStatusFilter] = useUrlFilter('status', 'all');
  const [paperStr, setPaperStr] = useUrlFilter('paper', '0');
  const [tagsStr, setTagsStr] = useUrlFilter('tags', '');
  const [groupBy, setGroupBy] = useUrlFilter('group', 'type');

  const paperFilter = Number(paperStr) || 0;
  const activeTags = tagsStr ? tagsStr.split(',') : [];

  const params: Record<string, string | number> = { limit: 500 };
  if (search) params.search = search;
  if (typeFilter !== 'all') params.type = typeFilter;
  if (formatFilter !== 'all') params.format = formatFilter;
  if (statusFilter !== 'all') params.extractedStatus = statusFilter;
  if (paperFilter) params.paper = paperFilter;
  if (activeTags.length > 0) params.tags = activeTags.join(',');

  const { data, isLoading } = useQuery({
    queryKey: ['sources', params],
    queryFn: () => getSources(params),
  });

  const { data: tagData } = useQuery({
    queryKey: ['source-tags'],
    queryFn: getSourceTags,
    staleTime: 60_000,
  });

  const allSources = data?.sources ?? [];
  const total = data?.total ?? 0;
  const topTags = (tagData ?? []).slice(0, 15);
  const [page, setPage] = useState(0);

  const pagedSources = useMemo(() =>
    allSources.slice(page * SRC_PAGE_SIZE, (page + 1) * SRC_PAGE_SIZE),
    [allSources, page]
  );

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const slice = pagedSources;
    const groups: Record<string, SourceListItem[]> = {};
    for (const s of slice) {
      let key: string;
      if (groupBy === 'type') key = TYPE_LABELS[s.type] || s.type;
      else if (groupBy === 'paper') key = s.paper ? `Paper ${s.paper}` : 'Unassigned';
      else key = extractDomain(s.origin);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [pagedSources, groupBy]);

  function toggleTag(tag: string) {
    const next = activeTags.includes(tag) ? activeTags.filter(t => t !== tag) : [...activeTags, tag];
    setTagsStr(next.join(','));
    setPage(0);
  }

  function clearAllFilters() {
    setSearch('');
    setTypeFilter('all');
    setFormatFilter('all');
    setStatusFilter('all');
    setPaperStr('0');
    setTagsStr('');
    setPage(0);
  }

  const hasActiveFilters = search || typeFilter !== 'all' || formatFilter !== 'all' || statusFilter !== 'all' || paperFilter !== 0 || activeTags.length > 0;

  const activeFilterBadges: { label: string; clear: () => void }[] = [];
  if (search) activeFilterBadges.push({ label: `Search: "${search}"`, clear: () => setSearch('') });
  if (typeFilter !== 'all') activeFilterBadges.push({ label: `Type: ${typeFilter}`, clear: () => setTypeFilter('all') });
  if (formatFilter !== 'all') activeFilterBadges.push({ label: `Format: ${formatFilter}`, clear: () => setFormatFilter('all') });
  if (statusFilter !== 'all') activeFilterBadges.push({ label: `Status: ${statusFilter}`, clear: () => setStatusFilter('all') });
  if (paperFilter) activeFilterBadges.push({ label: `Paper ${paperFilter}`, clear: () => setPaperStr('0') });
  for (const t of activeTags) {
    activeFilterBadges.push({ label: `Tag: ${t}`, clear: () => toggleTag(t) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Sources</h1>
        <span className="text-sm text-gray-500">
          {allSources.length}{hasActiveFilters ? ` / ${total}` : ''} source{allSources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search title and content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg"
            style={{ border: '1px solid var(--pink-light)' }}
          />
        </div>

        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select value={formatFilter} onChange={(e) => { setFormatFilter(e.target.value); setPage(0); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {SOURCE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {EXTRACTED_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => { setPaperStr(String(p)); setPage(0); }}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors"
              style={paperFilter === p
                ? { borderColor: 'var(--pink)', background: 'var(--pink-light)', color: 'var(--pink-dark)' }
                : { borderColor: '#f0e8e0' }
              }
            >
              {p === 0 ? 'All' : `P${p}`}
            </button>
          ))}
        </div>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="type">Group by Type</option>
          <option value="none">No grouping</option>
          <option value="paper">Group by Paper</option>
          <option value="origin">Group by Origin</option>
        </select>
      </div>

      {/* Active filter badges */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-400 mr-1">Active:</span>
          {activeFilterBadges.map((b) => (
            <button
              key={b.label}
              onClick={b.clear}
              className="tag-pill flex items-center gap-1 transition-colors"
            >
              {b.label}
              <X size={10} />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-gray-500 hover:text-gray-700 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Tag filter chips */}
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTagsStr('')}
            className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
            style={activeTags.length === 0
              ? { borderColor: 'var(--pink)', background: 'var(--pink-light)', color: 'var(--pink-dark)' }
              : { borderColor: '#f0e8e0' }
            }
          >
            All tags
          </button>
          {topTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="px-2.5 py-1 text-xs font-medium rounded-full border transition-colors"
              style={activeTags.includes(tag)
                ? { borderColor: 'var(--pink)', background: 'var(--pink-light)', color: 'var(--pink-dark)' }
                : { borderColor: '#f0e8e0' }
              }
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : allSources.length === 0 ? (
          <div className="p-12 text-center">
            {hasActiveFilters ? (
              <div className="space-y-2">
                <Search size={28} className="mx-auto text-gray-300" />
                <p className="text-sm text-gray-400">No sources match your filters</p>
                <button onClick={clearAllFilters} className="text-xs font-medium" style={{ color: 'var(--pink-dark)' }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No sources found</p>
            )}
          </div>
        ) : grouped ? (
          <div>
            {grouped.map(([group, items], idx) => (
              <GroupSection key={group} title={group} count={items.length} defaultOpen={idx === 0}>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((s) => (
                      <SourceRow key={s._id} s={s} onClick={() => navigate(`/sources/${s._id}`)} />
                    ))}
                  </tbody>
                </table>
              </GroupSection>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <TableHeader />
            <tbody>
              {pagedSources.map((s) => (
                <SourceRow key={s._id} s={s} onClick={() => navigate(`/sources/${s._id}`)} />
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={SRC_PAGE_SIZE} total={allSources.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
