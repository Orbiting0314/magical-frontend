import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Editor } from '@tiptap/react';
import { Search, X, ArrowLeft, Plus, Filter } from 'lucide-react';
import { getComponents, getComponent } from '../../api/components';
import { markdownToHtml } from '../../lib/serializer';
import type { ComponentListItem, ComponentType } from '../../types';
import { COMPONENT_TYPE_COLORS, TOPIC_NAMES } from '../../types';

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'concept', label: 'Concept' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'worked-example', label: 'Worked Example' },
  { value: 'mistakes', label: 'Mistakes' },
  { value: 'level-benchmark', label: 'Level Benchmark' },
  { value: 'phrases', label: 'Phrases' },
  { value: 'drill', label: 'Drill' },
];

interface ComponentPickerProps {
  open: boolean;
  onClose: () => void;
  editor: Editor;
  onInserted: (componentId: string) => void;
}

function TypeBadge({ type }: { type: ComponentType }) {
  const c = COMPONENT_TYPE_COLORS[type];
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

export default function ComponentPicker({ open, onClose, editor, onInserted }: ComponentPickerProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setTypeFilter('');
      setPreviewId(null);
      setShowFilters(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (previewId) setPreviewId(null);
        else onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, previewId, onClose]);

  const filters: Record<string, string> = {};
  if (debouncedSearch) filters.search = debouncedSearch;
  if (typeFilter) filters.type = typeFilter;

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['components-picker', filters],
    queryFn: () => getComponents(filters),
    enabled: open,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['component', previewId],
    queryFn: () => getComponent(previewId!),
    enabled: !!previewId,
    staleTime: 60_000,
  });

  const handleInsert = useCallback(() => {
    if (!detail) return;
    const { html } = markdownToHtml(detail.content);
    editor.chain().focus().insertContent(html).run();
    onInserted(detail._id);
    setPreviewId(null);
    onClose();
  }, [detail, editor, onInserted, onClose]);

  if (!open) return null;

  const components = listData?.components ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[640px] max-h-[75vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          {previewId ? (
            <button
              onClick={() => setPreviewId(null)}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
          ) : null}
          <h3 className="text-sm font-semibold text-gray-800 flex-1">
            {previewId ? 'Component Preview' : 'Insert from Knowledge Base'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        {previewId ? (
          /* Preview view */
          <PreviewPane
            detail={detail ?? null}
            loading={detailLoading}
            onInsert={handleInsert}
          />
        ) : (
          /* List view */
          <>
            {/* Search + filters */}
            <div className="px-4 py-2.5 border-b border-gray-100 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search components..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
                    style={{ border: '1px solid var(--pink-light)' }}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`p-1.5 rounded transition-colors ${showFilters ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                  title="Filters"
                >
                  <Filter size={14} />
                </button>
              </div>
              {showFilters && (
                <div className="flex items-center gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="text-center text-gray-400 text-sm py-8">Searching...</div>
              ) : components.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">No components found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {components.map((comp) => (
                    <ComponentRow
                      key={comp._id}
                      comp={comp}
                      onSelect={() => setPreviewId(comp._id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer count */}
            <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400">
              {listData?.total ?? 0} components
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ComponentRow({ comp, onSelect }: { comp: ComponentListItem; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{comp.name}</div>
        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
          {comp.topic && <span>{TOPIC_NAMES[comp.topic] || comp.topic}</span>}
          {comp.level !== 'all' && <span>{comp.level}</span>}
        </div>
      </div>
      <TypeBadge type={comp.type} />
    </button>
  );
}

function PreviewPane({
  detail,
  loading,
  onInsert,
}: {
  detail: { _id: string; name: string; type: ComponentType; content: string; level: string; topic: string | null; tags: string[] } | null;
  loading: boolean;
  onInsert: () => void;
}) {
  if (loading || !detail) {
    return <div className="text-center text-gray-400 text-sm py-8">Loading preview...</div>;
  }

  const { html } = markdownToHtml(detail.content);

  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800">{detail.name}</div>
          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
            <TypeBadge type={detail.type} />
            {detail.topic && <span>{TOPIC_NAMES[detail.topic] || detail.topic}</span>}
            {detail.level !== 'all' && <span>{detail.level}</span>}
          </div>
        </div>
        <button
          onClick={onInsert}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ background: 'var(--gold-dark)' }}
        >
          <Plus size={13} />
          Insert
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto px-5 py-4 md-content prose-editor text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {detail.tags.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-1">
          {detail.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
