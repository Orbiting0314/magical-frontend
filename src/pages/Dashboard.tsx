import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Key, Plus, X, Search, ArrowUpDown, FileQuestion } from 'lucide-react';
import { getComponents } from '../api/components';
import { getNotes, createNote } from '../api/notes';
import { getAnswerKeys } from '../api/answerKeys';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';
import type { NoteListItem } from '../types';

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

const PAPER_OPTIONS = [
  { value: 1, label: 'Paper 1 - Reading' },
  { value: 2, label: 'Paper 2 - Writing' },
  { value: 3, label: 'Paper 3 - Listening & Integrated' },
  { value: 4, label: 'Paper 4 - Speaking' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All levels' },
  { value: 'lev5+', label: 'Level 5+' },
  { value: 'lev3-4', label: 'Level 3-4' },
];

const TOPIC_BY_PAPER: Record<number, string[]> = {
  1: ['short-answer', 'reference', 'true-false-not-given', 'multiple-choice', 'summary-cloze', 'vocabulary-meaning', 'inference', 'writers-tone-attitude', 'matching-sequencing', 'open-ended-response', 'overview-and-strategy'],
  2: ['letter-to-editor', 'letter-of-advice', 'argumentative-essay', 'article', 'speech', 'report', 'proposal', 'blog-post', 'letter-of-complaint', 'short-story', 'review', 'formal-letter'],
  3: ['event-update', 'report', 'proposal', 'letter-of-advice', 'article', 'speech'],
  4: ['agree-disagree', 'advantages-disadvantages', 'cause-effect', 'giving-advice', 'hypothetical', 'making-comparisons', 'prioritising-ranking', 'problem-solution', 'general-speaking-skills'],
};

type SortKey = 'title' | 'paper' | 'status' | 'updatedAt';
type SortDir = 'asc' | 'desc';

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

function CreateNoteModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; paper: number; topic: string; level: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [paper, setPaper] = useState(1);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('all');

  if (!open) return null;

  const topics = TOPIC_BY_PAPER[paper] || [];
  const canCreate = title.trim() && topic;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    onCreate({ title: title.trim(), paper, topic, level });
    setTitle('');
    setTopic('');
    setLevel('all');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">New Note</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vocabulary Meaning - Set 1"
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: '1px solid var(--pink-light)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Paper</label>
              <select
                value={paper}
                onChange={(e) => { setPaper(Number(e.target.value)); setTopic(''); }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                {PAPER_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
            >
              <option value="">Select topic...</option>
              {topics.map((t) => (
                <option key={t} value={t}>{TOPIC_NAMES[t] || t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canCreate}
            className="btn-pink px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [paperFilter, setPaperFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: compData } = useQuery({ queryKey: ['components-count'], queryFn: () => getComponents() });
  const { data: noteData } = useQuery({ queryKey: ['notes'], queryFn: () => getNotes() });
  const { data: akData } = useQuery({ queryKey: ['answer-keys-count'], queryFn: () => getAnswerKeys() });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; paper: number; topic: string; level: string }) => createNote(data),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setCreateOpen(false);
      navigate(`/notes/${note._id}`);
    },
  });

  const allNotes = noteData?.notes ?? [];

  const filteredNotes = useMemo(() => {
    let result = allNotes;
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
  }, [allNotes, searchText, paperFilter, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'updatedAt' ? 'desc' : 'asc');
    }
  }

  const hasFilters = searchText || paperFilter !== '' || statusFilter;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Notes</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-pink flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={15} />
          New Note
        </button>
      </div>
      <CreateNoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(data) => createMutation.mutate(data)}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Components"
          value={compData?.total ?? '-'}
          icon={BookOpen}
          onClick={() => navigate('/knowledge')}
        />
        <StatCard
          label="Notes"
          value={noteData?.total ?? '-'}
          icon={FileText}
        />
        <StatCard
          label="Answer Keys"
          value={akData?.total ?? '-'}
          icon={Key}
          onClick={() => navigate('/answer-keys')}
        />
      </div>

      <div className="card overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: '#f0e8e0' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--pink-light)' }}
            />
          </div>
          <select
            value={paperFilter}
            onChange={(e) => setPaperFilter(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All papers</option>
            {PAPER_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>P{p.value}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
          >
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown size={12} className="text-gray-400" />
            <select
              value={`${sortKey}-${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split('-') as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
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
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('title')}>
                Title {sortKey === 'title' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
              <th className="px-5 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('paper')}>
                Paper {sortKey === 'paper' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
              <th className="px-5 py-2.5">Topic</th>
              <th className="px-5 py-2.5">Level</th>
              <th className="px-5 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('status')}>
                Status {sortKey === 'status' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
              <th className="px-5 py-2.5 cursor-pointer hover:text-gray-700" onClick={() => toggleSort('updatedAt')}>
                Modified {sortKey === 'updatedAt' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note) => (
              <tr
                key={note._id}
                className="border-b cursor-pointer transition-colors"
                style={{ borderColor: '#f8f0ea' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                onClick={() => navigate(`/notes/${note._id}`)}
              >
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--navy)' }}>
                  {note.title}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--cream)', color: 'var(--navy-light)' }}>
                    {PAPER_NAMES[note.paper] ? `P${note.paper}` : note.paper}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600">
                  {TOPIC_NAMES[note.topic] || note.topic}
                </td>
                <td className="px-5 py-3"><LevelBadge level={note.level} /></td>
                <td className="px-5 py-3"><StatusBadge status={note.status} /></td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filteredNotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  {hasFilters ? (
                    <div className="space-y-2">
                      <Search size={28} className="mx-auto text-gray-300" />
                      <p className="text-sm text-gray-400">No notes match your filters</p>
                      <button
                        onClick={() => { setSearchText(''); setPaperFilter(''); setStatusFilter(''); }}
                        className="text-xs font-medium"
                        style={{ color: 'var(--pink-dark)' }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FileQuestion size={32} className="mx-auto text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">No notes yet</p>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Create your first note to start building DSE English teaching materials.
                        Each note targets a specific paper, topic, and level.
                      </p>
                      <button
                        onClick={() => setCreateOpen(true)}
                        className="btn-pink inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        <Plus size={14} />
                        Create your first note
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer count */}
        <div className="px-5 py-2 border-t text-[11px]" style={{ borderColor: '#f0e8e0', color: 'var(--navy-light)' }}>
          {filteredNotes.length} of {allNotes.length} notes
        </div>
      </div>
    </div>
  );
}
