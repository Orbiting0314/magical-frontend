import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Search, X, Download,
  Loader2, FileText, ExternalLink,
} from 'lucide-react';
import { getAnswerKeys, getAnswerKey } from '../api/answerKeys';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';
import type { AnswerKeyListItem, Answer } from '../types';
import api from '../api/client';

function AnswerTable({ answers, searchTerm }: { answers: Answer[]; searchTerm: string }) {
  const filtered = useMemo(() => {
    if (!searchTerm) return answers;
    const lc = searchTerm.toLowerCase();
    return answers.filter(
      a =>
        String(a.year).includes(lc) ||
        String(a.number).includes(lc) ||
        a.question.toLowerCase().includes(lc) ||
        a.answer.toLowerCase().includes(lc),
    );
  }, [answers, searchTerm]);

  if (filtered.length === 0) {
    return (
      <div className="text-xs text-gray-400 py-3 px-4">
        No answers match &quot;{searchTerm}&quot;
      </div>
    );
  }

  return (
    <table className="w-full text-sm mt-2">
      <thead>
        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <th className="px-4 py-2 w-12">#</th>
          <th className="px-4 py-2 w-16">Year</th>
          <th className="px-4 py-2">Question</th>
          <th className="px-4 py-2">Answer</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((a, i) => (
          <tr key={i} className="border-b border-gray-50">
            <td className="px-4 py-2 text-gray-400">{a.number}</td>
            <td className="px-4 py-2 text-gray-500">{a.year}</td>
            <td className="px-4 py-2 text-gray-700">{a.question}</td>
            <td className="px-4 py-2 font-medium" style={{ color: 'var(--navy)' }}>{a.answer}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnswerKeyRow({
  item,
  searchTerm,
}: {
  item: AnswerKeyListItem;
  searchTerm: string;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ['answer-key', item._id],
    queryFn: () => getAnswerKey(item._id),
    enabled: expanded,
  });

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!detail) return;
    setDownloading(true);
    try {
      const response = await api.post('/render/download', {
        markdown: detail.markdown,
        level: detail.level,
        filename: detail.title,
      }, { responseType: 'blob' });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fail silently for now
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3 text-sm hover:bg-gray-50 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
        <span className="flex-1 text-left font-medium" style={{ color: 'var(--navy)' }}>
          {item.title}
        </span>

        {item.noteId && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/notes/${item.noteId}`); }}
            title="Open linked note"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <FileText size={11} />
            Note
          </button>
        )}

        {item.set && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{item.set}</span>
        )}
        <span className="text-xs text-gray-400">
          {TOPIC_NAMES[item.topic] || item.topic}
        </span>
      </button>

      {expanded && detail?.answers && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              Download PDF
            </button>
            {item.noteId ? (
              <button
                onClick={() => navigate(`/notes/${item.noteId}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <ExternalLink size={11} />
                Go to Note
              </button>
            ) : (
              <span className="text-[11px] text-gray-400">No linked note</span>
            )}
          </div>
          <AnswerTable answers={detail.answers} searchTerm={searchTerm} />
        </div>
      )}
    </div>
  );
}

export default function AnswerKeys() {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paperFilter, setPaperFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const filters = useMemo(() => {
    const f: { paper?: number; search?: string } = {};
    if (paperFilter) f.paper = Number(paperFilter);
    if (debouncedSearch) f.search = debouncedSearch;
    return f;
  }, [paperFilter, debouncedSearch]);

  const { data } = useQuery({
    queryKey: ['answer-keys', filters],
    queryFn: () => getAnswerKeys(filters),
  });

  const answerKeys = data?.answerKeys ?? [];

  const localFiltered = useMemo(() => {
    if (!debouncedSearch) return answerKeys;
    const lc = debouncedSearch.toLowerCase();
    return answerKeys.filter(
      ak =>
        ak.title.toLowerCase().includes(lc) ||
        ak.topic.toLowerCase().includes(lc) ||
        ak.set.toLowerCase().includes(lc),
    );
  }, [answerKeys, debouncedSearch]);

  const grouped = useMemo(() => {
    return localFiltered.reduce<Record<number, AnswerKeyListItem[]>>((acc, ak) => {
      if (!acc[ak.paper]) acc[ak.paper] = [];
      acc[ak.paper].push(ak);
      return acc;
    }, {});
  }, [localFiltered]);

  const papers = Object.keys(grouped).map(Number).sort();

  const hasFilters = !!searchText || !!paperFilter;

  function clearFilters() {
    setSearchText('');
    setPaperFilter('');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Answer Keys</h1>
        <span className="text-xs text-gray-400">{localFiltered.length} sets</span>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by title, year, question, answer..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg transition-colors"
            style={{ border: '1px solid var(--pink-light)' }}
          />
          {searchText && (
            <button
              onClick={() => { setSearchText(''); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={paperFilter}
          onChange={(e) => setPaperFilter(e.target.value)}
          className="text-sm rounded-lg px-3 py-2"
          style={{ border: '1px solid var(--pink-light)' }}
        >
          <option value="">All Papers</option>
          <option value="1">Paper 1 -- Reading</option>
          <option value="2">Paper 2 -- Writing</option>
          <option value="3">Paper 3 -- Listening</option>
          <option value="4">Paper 4 -- Speaking</option>
        </select>
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchText && (
            <FilterBadge label={`Search: "${searchText}"`} onClear={() => setSearchText('')} />
          )}
          {paperFilter && (
            <FilterBadge
              label={`Paper ${paperFilter}`}
              onClear={() => setPaperFilter('')}
            />
          )}
          <button
            onClick={clearFilters}
            className="text-[11px] text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {papers.length === 0 && (
        <div className="text-center py-12 card">
          <div className="text-gray-400 text-sm">
            {hasFilters
              ? 'No answer keys match your filters'
              : 'No answer keys found'}
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs underline"
              style={{ color: 'var(--pink-dark)' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {papers.map((paper) => (
        <PaperGroup
          key={paper}
          paper={paper}
          items={grouped[paper]}
          searchTerm={debouncedSearch}
        />
      ))}
    </div>
  );
}

function PaperGroup({
  paper,
  items,
  searchTerm,
}: {
  paper: number;
  items: AnswerKeyListItem[];
  searchTerm: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          {PAPER_NAMES[paper] || `Paper ${paper}`}
        </span>
        <span className="text-xs text-gray-400">{items.length} sets</span>
      </button>
      {open && (
        <div>
          {items.map((item) => (
            <AnswerKeyRow key={item._id} item={item} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBadge({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="tag-pill inline-flex items-center gap-1 px-2.5 py-1">
      {label}
      <button onClick={onClear} className="transition-colors" style={{ color: 'var(--pink-dark)' }}>
        <X size={11} />
      </button>
    </span>
  );
}
