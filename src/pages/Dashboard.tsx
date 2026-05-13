import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Key } from 'lucide-react';
import { getComponents } from '../api/components';
import { getNotes } from '../api/notes';
import { getAnswerKeys } from '../api/answerKeys';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="p-2.5 rounded-lg" style={{ background: 'var(--cream)' }}>
        <Icon size={20} style={{ color: 'var(--gold-dark)' }} />
      </div>
      <div>
        <div className="text-2xl font-semibold" style={{ color: 'var(--navy)' }}>{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: compData } = useQuery({ queryKey: ['components-count'], queryFn: () => getComponents() });
  const { data: noteData } = useQuery({ queryKey: ['notes'], queryFn: () => getNotes() });
  const { data: akData } = useQuery({ queryKey: ['answer-keys-count'], queryFn: () => getAnswerKeys() });

  const notes = noteData?.notes ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--navy)' }}>Notes</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Components" value={compData?.total ?? '-'} icon={BookOpen} />
        <StatCard label="Notes" value={noteData?.total ?? '-'} icon={FileText} />
        <StatCard label="Answer Keys" value={akData?.total ?? '-'} icon={Key} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Notes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-2.5">Title</th>
              <th className="px-5 py-2.5">Paper</th>
              <th className="px-5 py-2.5">Topic</th>
              <th className="px-5 py-2.5">Level</th>
              <th className="px-5 py-2.5">Status</th>
              <th className="px-5 py-2.5">Modified</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr
                key={note._id}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
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
            {notes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No notes found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
