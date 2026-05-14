import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ArrowLeft, RotateCcw, X } from 'lucide-react';
import { getNoteVersions, getNoteVersion } from '../../api/notes';
import type { NoteVersionSummary } from '../../types';

interface VersionHistoryProps {
  noteId: string;
  currentMarkdown: string;
  onRestore: (versionId: string) => void;
  onClose: () => void;
}

function diffSummary(oldMd: string, newMd: string): { added: number; removed: number } {
  const oldLines = oldMd.split('\n');
  const newLines = newMd.split('\n');
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  let added = 0;
  let removed = 0;
  for (const line of newLines) if (!oldSet.has(line)) added++;
  for (const line of oldLines) if (!newSet.has(line)) removed++;
  return { added, removed };
}

function VersionDetail({
  noteId,
  version,
  currentMarkdown,
  onRestore,
  onBack,
}: {
  noteId: string;
  version: NoteVersionSummary;
  currentMarkdown: string;
  onRestore: (versionId: string) => void;
  onBack: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['note-version', noteId, version._id],
    queryFn: () => getNoteVersion(noteId, version._id),
  });

  const diff = data ? diffSummary(data.markdown, currentMarkdown) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#f0e8e0' }}>
        <button onClick={onBack} className="p-1 rounded transition-colors" style={{ color: 'var(--navy-light)' }}>
          <ArrowLeft size={14} />
        </button>
        <span className="text-xs font-medium flex-1" style={{ color: 'var(--navy)' }}>
          {formatDate(version.createdAt)}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-xs" style={{ color: 'var(--navy-light)' }}>
          Loading...
        </div>
      ) : data ? (
        <>
          <div className="px-3 py-2 border-b space-y-1.5" style={{ borderColor: '#f0e8e0' }}>
            {version.changeNote && (
              <div className="text-[11px]" style={{ color: 'var(--navy-light)' }}>
                {version.changeNote}
              </div>
            )}
            <div className="text-[10px]" style={{ color: 'var(--navy-light)' }}>
              by {version.createdBy}
            </div>
            {diff && (
              <div className="flex items-center gap-2 text-[10px]">
                {diff.removed > 0 && <span className="text-red-500">-{diff.removed} lines</span>}
                {diff.added > 0 && <span className="text-emerald-600">+{diff.added} lines</span>}
                {diff.added === 0 && diff.removed === 0 && (
                  <span style={{ color: 'var(--navy-light)' }}>No line changes vs current</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--navy-dark)' }}>
              {data.markdown}
            </pre>
          </div>

          <div className="px-3 py-2 border-t" style={{ borderColor: '#f0e8e0' }}>
            {confirming ? (
              <div className="space-y-1.5">
                <p className="text-[11px]" style={{ color: 'var(--navy-light)' }}>
                  This will replace the current content with this version. The current content will be saved as a new version first.
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { onRestore(version._id); setConfirming(false); }}
                    className="btn-pink px-3 py-1 rounded text-[11px] font-medium"
                  >
                    Confirm Restore
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1 rounded text-[11px]"
                    style={{ color: 'var(--navy-light)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ border: '1px solid var(--pink-light)', color: 'var(--pink-dark)' }}
              >
                <RotateCcw size={12} />
                Restore this version
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function VersionHistory({ noteId, currentMarkdown, onRestore, onClose }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<NoteVersionSummary | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['note-versions', noteId],
    queryFn: () => getNoteVersions(noteId),
  });

  const versions = data?.versions ?? [];

  if (selectedVersion) {
    return (
      <div className="card h-full flex flex-col overflow-hidden">
        <VersionDetail
          noteId={noteId}
          version={selectedVersion}
          currentMarkdown={currentMarkdown}
          onRestore={onRestore}
          onBack={() => setSelectedVersion(null)}
        />
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#f0e8e0' }}>
        <History size={14} style={{ color: 'var(--pink-dark)' }} />
        <span className="text-xs font-semibold flex-1" style={{ color: 'var(--navy)' }}>
          Version History
        </span>
        <span className="text-[10px]" style={{ color: 'var(--navy-light)' }}>
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onClose} className="p-0.5 rounded transition-colors" style={{ color: 'var(--navy-light)' }}>
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="text-xs text-center py-8" style={{ color: 'var(--navy-light)' }}>
            Loading versions...
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <div className="text-center py-8 px-3">
            <History size={24} className="mx-auto mb-2" style={{ color: 'var(--pink-light)' }} />
            <p className="text-xs" style={{ color: 'var(--navy-light)' }}>
              No previous versions yet
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--navy-light)', opacity: 0.6 }}>
              Versions are created automatically when you save changes
            </p>
          </div>
        )}

        {versions.map((v) => (
          <button
            key={v._id}
            onClick={() => setSelectedVersion(v)}
            className="w-full text-left px-3 py-2.5 border-b transition-colors"
            style={{ borderColor: '#f8f0ea' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            <div className="text-xs font-medium" style={{ color: 'var(--navy)' }}>
              {formatDate(v.createdAt)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px]" style={{ color: 'var(--navy-light)' }}>
                {v.createdBy}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--navy-light)', opacity: 0.5 }}>
                {formatSize(v.length)}
              </span>
            </div>
            {v.changeNote && (
              <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--pink-dark)' }}>
                {v.changeNote}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  return `${(chars / 1000).toFixed(1)}k chars`;
}
