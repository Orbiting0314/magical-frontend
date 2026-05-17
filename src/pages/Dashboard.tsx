import { useState, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Key, Search, ArrowUpDown, FileQuestion, Pin, Clock, LayoutList, LayoutGrid } from 'lucide-react';
import { getComponents } from '../api/components';
import { getNotes, updateNote } from '../api/notes';
import { getAnswerKeys } from '../api/answerKeys';
import toast from 'react-hot-toast';
import { PAPER_NAMES, TOPIC_NAMES, noteUrl } from '../types';
import type { NoteListItem } from '../types';
import Pagination from '../components/ui/Pagination';
import GroupSection from '../components/ui/GroupSection';

function StatCard({ label, value, icon: Icon, onClick }: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card p-5 flex items-center gap-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-2.5 rounded-lg" style={{ background: 'var(--pink-light)' }}>
        <Icon size={20} style={{ color: 'var(--pink-dark)' }} />
      </div>
      <div>
        <div className="text-2xl font-semibold" style={{ color: 'var(--navy)' }}>{value}</div>
        <div className="text-sm" style={{ color: 'var(--navy-light)' }}>{label}</div>
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    all: 'bg-gray-100 text-gray-700',
    'lev5+': 'bg-amber-100 text-amber-800',
    'lev3-4': 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level] || colors.all}`}>
      {level === 'all' ? 'All' : level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = status === 'published'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {status}
    </span>
  );
}

const DASH_PAGE_SIZE = 20;

type SortKey = 'title' | 'paper' | 'status' | 'updatedAt';
type SortDir = 'asc' | 'desc';
type GroupBy = 'none' | 'paper' | 'status';
type ViewMode = 'table' | 'grid';
type TabKey = 'generated' | 'custom';

interface FilterState {
  searchText: string;
  paperFilter: number | '';
  statusFilter: string;
  sortKey: SortKey;
  sortDir: SortDir;
  groupBy: GroupBy;
  page: number;
}

const DEFAULT_FILTERS: FilterState = {
  searchText: '',
  paperFilter: '',
  statusFilter: '',
  sortKey: 'updatedAt',
  sortDir: 'desc',
  groupBy: 'none',
  page: 0,
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'title', label: 'Title' },
  { value: 'paper', label: 'Paper' },
  { value: 'status', label: 'Status' },
];

function sortNotes(notes: NoteListItem[], key: SortKey, dir: SortDir): NoteListItem[] {
  return [...notes].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'title': cmp = a.title.localeCompare(b.title); break;
      case 'paper': cmp = a.paper - b.paper; break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NoteRow({ note, onClick, onTogglePin }: {
  note: NoteListItem;
  onClick: () => void;
  onTogglePin: () => void;
}) {
  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: '#f8f0ea' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <td className="px-3 py-3 w-8">
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className="p-0.5 rounded hover:bg-white/60 transition-colors"
          title={note.pinnedAt ? 'Unpin' : 'Pin'}
        >
          {note.pinnedAt
            ? <Pin size={13} className="text-pink-500 fill-pink-500" />
            : <Pin size={13} className="text-gray-300 hover:text-gray-500" />
          }
        </button>
      </td>
      <td className="px-3 py-3 font-medium cursor-pointer" style={{ color: 'var(--navy)' }} onClick={onClick}>{note.title}</td>
      <td className="px-3 py-3 cursor-pointer" onClick={onClick}>
        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--cream)', color: 'var(--navy-light)' }}>
          {PAPER_NAMES[note.paper] ? `P${note.paper}` : note.paper}
        </span>
      </td>
      <td className="px-3 py-3 text-gray-600 cursor-pointer" onClick={onClick}>{TOPIC_NAMES[note.topic] || note.topic}</td>
      <td className="px-3 py-3 cursor-pointer" onClick={onClick}><LevelBadge level={note.level} /></td>
      <td className="px-3 py-3 cursor-pointer" onClick={onClick}><StatusBadge status={note.status} /></td>
      <td className="px-3 py-3 text-gray-500 text-xs cursor-pointer" onClick={onClick}>{new Date(note.updatedAt).toLocaleDateString()}</td>
    </tr>
  );
}

function NoteCard({ note, onClick, onTogglePin }: {
  note: NoteListItem;
  onClick: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md relative group"
      style={{ background: 'white', border: '1px solid #f0e8e0' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
        title={note.pinnedAt ? 'Unpin' : 'Pin'}
      >
        {note.pinnedAt
          ? <Pin size={13} className="text-pink-500 fill-pink-500" />
          : <Pin size={13} className="text-gray-300" />
        }
      </button>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--cream)', color: 'var(--navy-light)' }}>
          P{note.paper}
        </span>
        <LevelBadge level={note.level} />
        <StatusBadge status={note.status} />
      </div>

      <div className="text-sm font-semibold mb-1.5 pr-6 line-clamp-1" style={{ color: 'var(--navy)' }}>
        {note.title}
      </div>

      {note.excerpt && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
          {note.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[10px] text-gray-400">{TOPIC_NAMES[note.topic] || note.topic}</span>
        <span className="text-[10px] text-gray-400">{relativeTime(note.updatedAt)}</span>
      </div>
    </div>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'generated', label: 'Teaching Notes' },
  { key: 'custom', label: 'My Notes' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('generated');
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('dash-view') as ViewMode) || 'table'
  );

  const [searchText, setSearchText] = useState('');
  const [paperFilter, setPaperFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const filterCache = useRef<Record<TabKey, FilterState>>({
    generated: { ...DEFAULT_FILTERS },
    custom: { ...DEFAULT_FILTERS },
  });

  const switchTab = useCallback((tab: TabKey) => {
    filterCache.current[activeTab] = {
      searchText, paperFilter, statusFilter, sortKey, sortDir, groupBy, page,
    };
    const cached = filterCache.current[tab];
    setSearchText(cached.searchText);
    setPaperFilter(cached.paperFilter);
    setStatusFilter(cached.statusFilter);
    setSortKey(cached.sortKey);
    setSortDir(cached.sortDir);
    setGroupBy(cached.groupBy);
    setPage(cached.page);
    setActiveTab(tab);
  }, [activeTab, searchText, paperFilter, statusFilter, sortKey, sortDir, groupBy, page]);

  function setView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem('dash-view', mode);
  }

  const { data: compData } = useQuery({ queryKey: ['components-count'], queryFn: () => getComponents() });
  const { data: noteData } = useQuery({ queryKey: ['notes'], queryFn: () => getNotes() });
  const { data: akData } = useQuery({ queryKey: ['answer-keys-count'], queryFn: () => getAnswerKeys() });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinnedAt }: { id: string; pinnedAt: string | null }) =>
      updateNote(id, { pinnedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => { toast.error('Failed to update pin'); },
  });

  const allNotes = noteData?.notes ?? [];

  const tabNotes = useMemo(() =>
    allNotes.filter(n => n.noteType === activeTab),
    [allNotes, activeTab]
  );

  const tabCounts = useMemo(() => ({
    generated: allNotes.filter(n => n.noteType === 'generated').length,
    custom: allNotes.filter(n => n.noteType === 'custom').length,
  }), [allNotes]);

  const filteredNotes = useMemo(() => {
    let result = tabNotes;
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (TOPIC_NAMES[n.topic] || n.topic).toLowerCase().includes(q)
      );
    }
    if (paperFilter !== '') {
      result = result.filter(n => n.paper === paperFilter);
    }
    if (statusFilter) {
      result = result.filter(n => n.status === statusFilter);
    }
    return sortNotes(result, sortKey, sortDir);
  }, [tabNotes, searchText, paperFilter, statusFilter, sortKey, sortDir]);

  const pagedNotes = useMemo(() =>
    filteredNotes.slice(page * DASH_PAGE_SIZE, (page + 1) * DASH_PAGE_SIZE),
    [filteredNotes, page]
  );

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups: Record<string, NoteListItem[]> = {};
    for (const n of pagedNotes) {
      let key: string;
      if (groupBy === 'paper') key = PAPER_NAMES[n.paper] || `Paper ${n.paper}`;
      else key = n.status.charAt(0).toUpperCase() + n.status.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }
    const entries = Object.entries(groups);
    if (groupBy === 'paper') entries.sort((a, b) => a[0].localeCompare(b[0]));
    else entries.sort((a, b) => b[1].length - a[1].length);
    return entries;
  }, [pagedNotes, groupBy]);

  const recentNotes = useMemo(() => {
    if (!allNotes.length) return [];
    return [...allNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [allNotes]);

  const pinnedNotes = useMemo(() =>
    allNotes
      .filter(n => n.pinnedAt)
      .sort((a, b) => new Date(b.pinnedAt!).getTime() - new Date(a.pinnedAt!).getTime()),
    [allNotes]
  );

  function handleFilterChange() {
    setPage(0);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'updatedAt' ? 'desc' : 'asc');
    }
  }

  function togglePin(note: NoteListItem) {
    pinMutation.mutate({
      id: note._id,
      pinnedAt: note.pinnedAt ? null : new Date().toISOString(),
    });
  }

  const hasFilters = searchText || paperFilter !== '' || statusFilter;

  const tableHeaders = (
    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
      <th className="px-3 py-2.5 w-8"></th>
      <th className="px-3 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('title')}>
        Title {sortKey === 'title' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
      </th>
      <th className="px-3 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('paper')}>
        Paper {sortKey === 'paper' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
      </th>
      <th className="px-3 py-2.5">Topic</th>
      <th className="px-3 py-2.5">Level</th>
      <th className="px-3 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('status')}>
        Status {sortKey === 'status' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
      </th>
      <th className="px-3 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('updatedAt')}>
        Modified {sortKey === 'updatedAt' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
      </th>
    </tr>
  );

  function renderNoteRows(notes: NoteListItem[]) {
    return notes.map((note) => (
      <NoteRow
        key={note._id}
        note={note}
        onClick={() => navigate(noteUrl(note))}
        onTogglePin={() => togglePin(note)}
      />
    ));
  }

  function renderNoteCards(notes: NoteListItem[]) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onClick={() => navigate(noteUrl(note))}
            onTogglePin={() => togglePin(note)}
          />
        ))}
      </div>
    );
  }

  function renderContent(notes: NoteListItem[]) {
    if (viewMode === 'grid') return renderNoteCards(notes);
    return (
      <table className="w-full text-sm">
        <tbody>{renderNoteRows(notes)}</tbody>
      </table>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Notes</h1>
      </div>

      {!hasFilters && recentNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recently Edited</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentNotes.map(note => (
              <div
                key={note._id}
                onClick={() => navigate(noteUrl(note))}
                className="flex-shrink-0 w-52 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
                style={{ background: 'white', border: '1px solid #f0e8e0' }}
              >
                <div className="text-xs font-semibold truncate mb-1" style={{ color: 'var(--navy)' }}>{note.title}</div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--cream)', color: 'var(--navy-light)' }}>
                    P{note.paper}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">{TOPIC_NAMES[note.topic] || note.topic}</span>
                </div>
                <div className="text-[10px] text-gray-400">{relativeTime(note.updatedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Components"
          value={compData?.total ?? '-'}
          icon={BookOpen}
          onClick={() => navigate('/knowledge')}
        />
        <StatCard
          label={activeTab === 'generated' ? 'Teaching Notes' : 'My Notes'}
          value={tabCounts[activeTab]}
          icon={FileText}
        />
        <StatCard
          label="Answer Keys"
          value={akData?.total ?? '-'}
          icon={Key}
          onClick={() => navigate('/answer-keys')}
        />
      </div>

      {pinnedNotes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-2.5 border-b flex items-center gap-2" style={{ borderColor: '#f0e8e0' }}>
            <Pin size={13} className="text-pink-500 fill-pink-500" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--navy)' }}>Pinned</span>
            <span className="text-[10px] text-gray-400 ml-1">{pinnedNotes.length}</span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {renderNoteRows(pinnedNotes)}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b" style={{ borderColor: '#f0e8e0' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className="relative pb-2.5 text-sm font-medium transition-colors"
            style={{ color: activeTab === key ? 'var(--pink-dark)' : 'var(--navy-light)' }}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-400">({tabCounts[key]})</span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--pink-dark)' }} />
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden relative">
        {/* Filter bar */}
        <div className="px-5 py-3 border-b flex items-center gap-3 sticky top-0 z-10 bg-white rounded-t-xl" style={{ borderColor: '#f0e8e0' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); handleFilterChange(); }}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--pink-light)' }}
            />
          </div>
          <select
            value={paperFilter}
            onChange={(e) => { setPaperFilter(e.target.value ? Number(e.target.value) : ''); handleFilterChange(); }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All papers</option>
            {[1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>P{p}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange(); }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="none">No grouping</option>
            <option value="paper">Group by Paper</option>
            <option value="status">Group by Status</option>
          </select>
          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown size={12} className="text-gray-400" />
            <select
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split('-') as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
                handleFilterChange();
              }}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={`${s.value}-desc`} value={`${s.value}-desc`}>{s.label} (newest)</option>
              ))}
              {SORT_OPTIONS.map((s) => (
                <option key={`${s.value}-asc`} value={`${s.value}-asc`}>{s.label} (oldest)</option>
              ))}
            </select>
            <div className="flex items-center ml-2 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('table')}
                className="p-1.5 transition-colors"
                style={{ background: viewMode === 'table' ? 'var(--pink-light)' : 'white', color: viewMode === 'table' ? 'var(--pink-dark)' : '#9ca3af' }}
                title="Table view"
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setView('grid')}
                className="p-1.5 transition-colors"
                style={{ background: viewMode === 'grid' ? 'var(--pink-light)' : 'white', color: viewMode === 'grid' ? 'var(--pink-dark)' : '#9ca3af' }}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            {hasFilters ? (
              <div className="space-y-2">
                <Search size={28} className="mx-auto text-gray-300" />
                <p className="text-sm text-gray-400">No notes match your filters</p>
                <button
                  onClick={() => { setSearchText(''); setPaperFilter(''); setStatusFilter(''); handleFilterChange(); }}
                  className="text-xs font-medium"
                  style={{ color: 'var(--pink-dark)' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <FileQuestion size={32} className="mx-auto text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  {activeTab === 'custom' ? 'No custom notes yet' : 'No teaching notes yet'}
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {activeTab === 'custom'
                    ? 'Create your own notes from scratch to supplement the teaching materials.'
                    : 'Teaching notes are AI-generated and managed by the system.'
                  }
                </p>
              </div>
            )}
          </div>
        ) : grouped ? (
          <div>
            {grouped.map(([group, items], idx) => (
              <GroupSection key={group} title={group} count={items.length} defaultOpen={idx < 4}>
                {renderContent(items)}
              </GroupSection>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          renderNoteCards(pagedNotes)
        ) : (
          <table className="w-full text-sm">
            <thead>{tableHeaders}</thead>
            <tbody>
              {renderNoteRows(pagedNotes)}
            </tbody>
          </table>
        )}

        <Pagination page={page} pageSize={DASH_PAGE_SIZE} total={filteredNotes.length} onPageChange={setPage} />

      </div>
    </div>
  );
}
