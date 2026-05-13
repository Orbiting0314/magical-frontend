import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, FileText, Globe, Image, ChevronDown, ChevronRight } from 'lucide-react';
import { getSources } from '../api/sources';
import { SOURCE_TYPES, SOURCE_FORMATS, EXTRACTED_STATUS_OPTIONS } from '../types';
import type { SourceType, SourceFormat, ExtractedStatus, SourceListItem } from '../types';

const FORMAT_ICONS: Record<string, React.ElementType> = {
  pdf: FileDown,
  text: FileText,
  markdown: FileText,
  image: Image,
  url: Globe,
};

const TYPE_COLORS: Record<string, string> = {
  'hkeaa-sample': 'bg-blue-100 text-blue-800',
  'hkeaa-report': 'bg-indigo-100 text-indigo-800',
  'hkeaa-stats': 'bg-violet-100 text-violet-800',
  'hkeaa-assessment': 'bg-purple-100 text-purple-800',
  'past-paper-ocr': 'bg-amber-100 text-amber-800',
  'answer-key-ocr': 'bg-orange-100 text-orange-800',
  'tutorial': 'bg-emerald-100 text-emerald-800',
  'school-reference': 'bg-teal-100 text-teal-800',
  'sample-note': 'bg-cyan-100 text-cyan-800',
  'other': 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-500',
  raw: 'bg-yellow-100 text-yellow-800',
  cleaned: 'bg-blue-100 text-blue-800',
  verified: 'bg-emerald-100 text-emerald-800',
};

const TAG_COLORS: Record<string, string> = {
  'question-types': 'bg-rose-50 text-rose-700 border-rose-200',
  'text-types': 'bg-blue-50 text-blue-700 border-blue-200',
  'strategies': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'sample-essays': 'bg-purple-50 text-purple-700 border-purple-200',
  'grading': 'bg-amber-50 text-amber-700 border-amber-200',
  'topics': 'bg-teal-50 text-teal-700 border-teal-200',
  'sentence-patterns': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'exam-data': 'bg-orange-50 text-orange-700 border-orange-200',
  'syllabus': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'vocabulary': 'bg-pink-50 text-pink-700 border-pink-200',
  'past-paper': 'bg-gray-50 text-gray-700 border-gray-200',
};

const CONTENT_TAGS = [
  'question-types', 'text-types', 'strategies', 'sample-essays',
  'grading', 'topics', 'sentence-patterns', 'exam-data', 'syllabus', 'vocabulary',
];

type GroupBy = 'none' | 'type' | 'paper' | 'tags';

function formatBytes(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TagChip({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${colors}`}>
      {tag}
    </span>
  );
}

function SourceRow({ s, onClick }: { s: SourceListItem; onClick: () => void }) {
  const FormatIcon = FORMAT_ICONS[s.format] || FileText;
  const contentTags = s.tags.filter(t => CONTENT_TAGS.includes(t));

  return (
    <tr
      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-5 py-3 max-w-sm">
        <div className="font-medium truncate" style={{ color: 'var(--navy)' }}>{s.title}</div>
        {contentTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {contentTags.slice(0, 4).map(t => <TagChip key={t} tag={t} />)}
            {contentTags.length > 4 && (
              <span className="text-[10px] text-gray-400">+{contentTags.length - 4}</span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[s.type] || TYPE_COLORS.other}`}>
          {s.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-1.5 text-gray-600">
          <FormatIcon size={14} />
          {s.format}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">{s.paper ? `P${s.paper}` : '-'}</td>
      <td className="px-4 py-3 text-gray-600">{s.year ?? '-'}</td>
      <td className="px-4 py-3 text-gray-500 text-xs">{formatBytes(s.originalFileSize)}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.extractedStatus] || STATUS_COLORS.none}`}>
          {s.extractedStatus}
        </span>
      </td>
    </tr>
  );
}

function GroupSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
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

function TableHeader() {
  return (
    <thead>
      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
        <th className="px-5 py-2.5">Title</th>
        <th className="px-4 py-2.5">Type</th>
        <th className="px-4 py-2.5">Format</th>
        <th className="px-4 py-2.5">Paper</th>
        <th className="px-4 py-2.5">Year</th>
        <th className="px-4 py-2.5">Size</th>
        <th className="px-4 py-2.5">Text</th>
      </tr>
    </thead>
  );
}

export default function Sources() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<SourceFormat | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ExtractedStatus | 'all'>('all');
  const [paperFilter, setPaperFilter] = useState<number | 0>(0);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  const params: Record<string, string | number> = { limit: 500 };
  if (search) params.search = search;
  if (typeFilter !== 'all') params.type = typeFilter;
  if (formatFilter !== 'all') params.format = formatFilter;
  if (statusFilter !== 'all') params.extractedStatus = statusFilter;
  if (paperFilter) params.paper = paperFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['sources', params],
    queryFn: () => getSources(params),
  });

  const allSources = data?.sources ?? [];
  const total = data?.total ?? 0;

  const filteredSources = useMemo(() => {
    if (!tagFilter) return allSources;
    return allSources.filter(s => s.tags.includes(tagFilter));
  }, [allSources, tagFilter]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups: Record<string, SourceListItem[]> = {};
    for (const s of filteredSources) {
      let key: string;
      if (groupBy === 'type') {
        key = s.type;
      } else if (groupBy === 'paper') {
        key = s.paper ? `Paper ${s.paper}` : 'General';
      } else {
        const contentTags = s.tags.filter(t => CONTENT_TAGS.includes(t));
        if (contentTags.length === 0) {
          key = 'Untagged';
        } else {
          key = contentTags[0];
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }

    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredSources, groupBy]);

  const availableTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allSources) {
      for (const t of s.tags) {
        if (CONTENT_TAGS.includes(t)) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [allSources]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Sources</h1>
        <span className="text-sm text-gray-500">
          {filteredSources.length}{tagFilter ? ` / ${total}` : ''} source{filteredSources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as SourceType | 'all')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as SourceFormat | 'all')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {SOURCE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ExtractedStatus | 'all')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          {EXTRACTED_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => setPaperFilter(p)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                paperFilter === p ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 0 ? 'All' : `P${p}`}
            </button>
          ))}
        </div>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          <option value="none">No grouping</option>
          <option value="type">Group by type</option>
          <option value="paper">Group by paper</option>
          <option value="tags">Group by tag</option>
        </select>
      </div>

      {/* Tag filter bar */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTagFilter(null)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
              !tagFilter ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            All tags
          </button>
          {availableTags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                tagFilter === tag ? 'border-blue-400 bg-blue-50 text-blue-700' : `border-gray-200 bg-white hover:bg-gray-50 ${(TAG_COLORS[tag] || '').split(' ')[1] || 'text-gray-600'}`
              }`}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredSources.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sources found</div>
        ) : grouped ? (
          /* Grouped view */
          <div>
            {grouped.map(([group, items]) => (
              <GroupSection key={group} title={group} count={items.length}>
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
          /* Flat view */
          <table className="w-full text-sm">
            <TableHeader />
            <tbody>
              {filteredSources.map((s) => (
                <SourceRow key={s._id} s={s} onClick={() => navigate(`/sources/${s._id}`)} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
