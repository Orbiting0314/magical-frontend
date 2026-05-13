import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, FileText, Globe, Image } from 'lucide-react';
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

function formatBytes(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Sources() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<SourceFormat | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ExtractedStatus | 'all'>('all');
  const [paperFilter, setPaperFilter] = useState<number | 0>(0);

  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  if (typeFilter !== 'all') params.type = typeFilter;
  if (formatFilter !== 'all') params.format = formatFilter;
  if (statusFilter !== 'all') params.extractedStatus = statusFilter;
  if (paperFilter) params.paper = paperFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['sources', params],
    queryFn: () => getSources(params),
  });

  const sources = data?.sources ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Sources</h1>
        <span className="text-sm text-gray-500">{total} source{total !== 1 ? 's' : ''}</span>
      </div>

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

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SourceType | 'all')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as SourceFormat | 'all')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          {SOURCE_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExtractedStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        >
          {EXTRACTED_STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((p) => (
            <button
              key={p}
              onClick={() => setPaperFilter(p)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                paperFilter === p
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 0 ? 'All' : `P${p}`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sources found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-2.5">Title</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Format</th>
                <th className="px-4 py-2.5">Paper</th>
                <th className="px-4 py-2.5">Year</th>
                <th className="px-4 py-2.5">Size</th>
                <th className="px-4 py-2.5">Text</th>
                <th className="px-4 py-2.5">Modified</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s: SourceListItem) => {
                const FormatIcon = FORMAT_ICONS[s.format] || FileText;
                return (
                  <tr
                    key={s._id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sources/${s._id}`)}
                  >
                    <td className="px-5 py-3 font-medium max-w-xs truncate" style={{ color: 'var(--navy)' }}>
                      {s.title}
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
                    <td className="px-4 py-3 text-gray-600">
                      {s.paper ? `P${s.paper}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.year ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatBytes(s.originalFileSize)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.extractedStatus] || STATUS_COLORS.none}`}>
                        {s.extractedStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
