import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTrashedNotes, restoreNote, permanentDeleteNote, emptyTrash } from '../api/notes';
import { TOPIC_NAMES } from '../types';

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Trash() {
  const queryClient = useQueryClient();
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', 'trash'],
    queryFn: getTrashedNotes,
  });

  const notes = data?.notes ?? [];

  const restoreMut = useMutation({
    mutationFn: restoreNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note restored');
    },
  });

  const permDeleteMut = useMutation({
    mutationFn: permanentDeleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Permanently deleted');
      setDeleteConfirmId(null);
    },
  });

  const emptyMut = useMutation({
    mutationFn: emptyTrash,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success(`${data.deleted} note(s) permanently deleted`);
      setEmptyConfirm(false);
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Trash
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--navy-light)' }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''} in trash
          </p>
        </div>
        {notes.length > 0 && (
          <button
            onClick={() => setEmptyConfirm(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
            style={{ color: '#dc2626', borderColor: '#fecaca' }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--navy-light)' }}>Loading...</div>
      )}

      {!isLoading && notes.length === 0 && (
        <div className="text-center py-16">
          <Trash2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm" style={{ color: 'var(--navy-light)' }}>Trash is empty</p>
        </div>
      )}

      {!isLoading && notes.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#f0e8e0' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--navy-light)', background: 'var(--cream)' }}>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Paper / Topic</th>
                <th className="px-4 py-2.5">Deleted</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(note => (
                <tr key={note._id} className="border-t hover:bg-gray-50/50 transition-colors" style={{ borderColor: '#f0e8e0' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--navy)' }}>
                    {note.title}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    P{note.paper} / {TOPIC_NAMES[note.topic] || note.topic}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {note.deletedAt ? relativeTime(note.deletedAt) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => restoreMut.mutate(note._id)}
                        disabled={restoreMut.isPending}
                        className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                        style={{ color: 'var(--pink-dark)', background: 'var(--pink-light)' }}
                      >
                        <RotateCcw size={12} className="inline mr-1" />
                        Restore
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(note._id)}
                        className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {emptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEmptyConfirm(false)} />
          <div className="relative bg-white rounded-xl p-6 shadow-xl max-w-sm mx-auto space-y-4" style={{ border: '1px solid #f0e8e0' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="font-semibold" style={{ color: 'var(--navy)' }}>Empty Trash</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--navy-light)' }}>
              This will permanently delete {notes.length} note{notes.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEmptyConfirm(false)}
                className="px-3 py-1.5 text-sm rounded-lg border" style={{ borderColor: '#e2e8f0' }}
              >
                Cancel
              </button>
              <button
                onClick={() => emptyMut.mutate()}
                disabled={emptyMut.isPending}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                {emptyMut.isPending ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-xl p-6 shadow-xl max-w-sm mx-auto space-y-4" style={{ border: '1px solid #f0e8e0' }}>
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="font-semibold" style={{ color: 'var(--navy)' }}>Permanently Delete</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--navy-light)' }}>
              This note will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm rounded-lg border" style={{ borderColor: '#e2e8f0' }}
              >
                Cancel
              </button>
              <button
                onClick={() => permDeleteMut.mutate(deleteConfirmId)}
                disabled={permDeleteMut.isPending}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                {permDeleteMut.isPending ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
