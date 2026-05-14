import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Database, ArrowRight, Plus, Pencil, RotateCcw, Trash2, ArrowUpDown } from 'lucide-react';
import { getActivity } from '../api/activity';
import type { ActivityEntry } from '../api/activity';

const PAGE_SIZE = 50;

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create: { label: 'Created', icon: Plus, color: '#16a34a' },
  update: { label: 'Updated', icon: Pencil, color: 'var(--navy)' },
  restore: { label: 'Restored', icon: RotateCcw, color: 'var(--purple)' },
  delete: { label: 'Deleted', icon: Trash2, color: '#dc2626' },
  status_change: { label: 'Status changed', icon: ArrowUpDown, color: 'var(--gold-dark)' },
};

const ACTOR_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  natty: { label: 'Natty', bg: 'var(--pink-light)', text: 'var(--pink-dark)' },
  mcp: { label: 'AI', bg: '#ede9fe', text: 'var(--purple)' },
  system: { label: 'System', bg: '#f3f4f6', text: '#6b7280' },
  admin: { label: 'Admin', bg: 'var(--gold-light)', text: 'var(--gold-dark)' },
};

const ENTITY_ICON: Record<string, React.ElementType> = {
  note: FileText,
  source: Database,
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function groupByDate(items: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();
  for (const item of items) {
    const key = new Date(item.createdAt).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

export default function ActivityLog() {
  const navigate = useNavigate();
  const [entityType, setEntityType] = useState('');
  const [actor, setActor] = useState('');
  const [skip, setSkip] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['activity', entityType, actor, skip],
    queryFn: () => getActivity({
      entityType: entityType || undefined,
      actor: actor || undefined,
      limit: PAGE_SIZE,
      skip,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const hasMore = skip + PAGE_SIZE < total;
  const dateGroups = groupByDate(items);

  function handleEntityClick(entry: ActivityEntry) {
    if (entry.action === 'delete') return;
    if (entry.entityType === 'note') {
      navigate(`/notes/${entry.entityId}`);
    } else if (entry.entityType === 'source') {
      navigate(`/sources/${entry.entityId}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)', fontFamily: "'Playfair Display', Georgia, serif" }}>
          Activity Log
        </h1>
        <span className="text-sm" style={{ color: 'var(--navy-light)' }}>
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#f8f0ea' }}>
          <Clock size={14} style={{ color: 'var(--pink-dark)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--navy)' }}>Filters</span>

          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setSkip(0); }}
            className="text-xs px-2 py-1 rounded-lg border outline-none"
            style={{ borderColor: 'var(--pink-light)' }}
          >
            <option value="">All types</option>
            <option value="note">Notes</option>
            <option value="source">Sources</option>
          </select>

          <select
            value={actor}
            onChange={(e) => { setActor(e.target.value); setSkip(0); }}
            className="text-xs px-2 py-1 rounded-lg border outline-none"
            style={{ borderColor: 'var(--pink-light)' }}
          >
            <option value="">All actors</option>
            <option value="natty">Natty</option>
            <option value="mcp">AI</option>
            <option value="system">System</option>
          </select>

          {(entityType || actor) && (
            <button
              onClick={() => { setEntityType(''); setActor(''); setSkip(0); }}
              className="text-xs font-medium ml-auto"
              style={{ color: 'var(--pink-dark)' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Timeline feed */}
        <div className="divide-y" style={{ borderColor: '#f8f0ea' }}>
          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Loading activity...</div>
          ) : items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Clock size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No activity recorded yet</p>
              <p className="text-xs text-gray-300 mt-1">Actions will appear here as you create and edit notes</p>
            </div>
          ) : (
            <>
              {[...dateGroups.entries()].map(([dateKey, entries]) => (
                <div key={dateKey}>
                  <div className="px-5 py-2 text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--navy-light)', background: 'var(--cream)' }}>
                    {formatDate(entries[0].createdAt)}
                  </div>
                  {entries.map((entry) => {
                    const actionCfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.update;
                    const actorCfg = ACTOR_CONFIG[entry.actor] || ACTOR_CONFIG.system;
                    const EntityIcon = ENTITY_ICON[entry.entityType] || FileText;
                    const ActionIcon = actionCfg.icon;
                    const isClickable = entry.action !== 'delete';

                    return (
                      <div
                        key={entry._id}
                        className={`flex items-start gap-3 px-5 py-3 transition-colors ${isClickable ? 'cursor-pointer' : ''}`}
                        style={{ borderBottom: '1px solid #f8f0ea' }}
                        onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.background = 'var(--pink-light)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                        onClick={() => handleEntityClick(entry)}
                      >
                        {/* Action icon */}
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5"
                          style={{ background: 'var(--pink-light)' }}
                        >
                          <ActionIcon size={13} style={{ color: actionCfg.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium" style={{ color: actionCfg.color }}>
                              {actionCfg.label}
                            </span>
                            <EntityIcon size={12} className="text-gray-400" />
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--navy)' }}>
                              {entry.entityTitle}
                            </span>
                            {isClickable && (
                              <ArrowRight size={11} className="text-gray-300 shrink-0" />
                            )}
                          </div>

                          {entry.summary && (
                            <p className="text-xs text-gray-500 mt-0.5">{entry.summary}</p>
                          )}

                          {entry.diff && (entry.diff.linesAdded > 0 || entry.diff.linesRemoved > 0) && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-mono text-emerald-600">+{entry.diff.linesAdded}</span>
                              <span className="text-[11px] font-mono text-red-500">-{entry.diff.linesRemoved}</span>
                              {entry.diff.containersAdded.length > 0 && (
                                <span className="text-[10px] text-gray-400">
                                  added :::{entry.diff.containersAdded.join(', :::')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right: actor badge + time */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: actorCfg.bg, color: actorCfg.text }}
                          >
                            {actorCfg.label}
                          </span>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {relativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination footer */}
        {items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#f8f0ea' }}>
            <span className="text-xs text-gray-400">
              Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              {skip > 0 && (
                <button
                  onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
                  className="text-xs font-medium px-3 py-1 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--pink-light)', color: 'var(--pink-dark)' }}
                >
                  Previous
                </button>
              )}
              {hasMore && (
                <button
                  onClick={() => setSkip(skip + PAGE_SIZE)}
                  className="text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                  style={{ background: 'var(--pink)', color: 'white' }}
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
