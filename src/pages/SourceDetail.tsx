import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Save, Trash2, ExternalLink, FileX } from 'lucide-react';
import { marked } from 'marked';
import toast from 'react-hot-toast';
import { getSource, updateSource, deleteSource, getSourceFileUrl } from '../api/sources';
import { SOURCE_TYPES, EXTRACTED_STATUS_OPTIONS, noteUrl } from '../types';
import type { ExtractedStatus, SourceType } from '../types';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function stripFrontmatter(text: string): string {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('---', 3);
  if (end === -1) return text;
  return text.slice(end + 3).trim();
}

export default function SourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: source, isLoading } = useQuery({
    queryKey: ['source', id],
    queryFn: () => getSource(id!),
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [type, setType] = useState<SourceType>('tutorial');
  const [paper, setPaper] = useState<number | ''>('');
  const [year, setYear] = useState<number | ''>('');
  const [origin, setOrigin] = useState('');
  const [tags, setTags] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [extractedStatus, setExtractedStatus] = useState<ExtractedStatus>('none');
  const [dirty, setDirty] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('rendered');

  const renderedHtml = useMemo(() => {
    if (viewMode !== 'rendered' || !extractedText) return '';
    return marked.parse(stripFrontmatter(extractedText), { async: false }) as string;
  }, [viewMode, extractedText]);

  useEffect(() => {
    if (source) {
      setTitle(source.title);
      setType(source.type);
      setPaper(source.paper ?? '');
      setYear(source.year ?? '');
      setOrigin(source.origin ?? '');
      setTags(source.tags.join(', '));
      setExtractedText(source.extractedText ?? '');
      setExtractedStatus(source.extractedStatus);
      setDirty(false);
    }
  }, [source]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSource(id!, {
        title,
        type,
        paper: paper === '' ? null : Number(paper),
        year: year === '' ? null : Number(year),
        origin: origin || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        extractedText: extractedText || null,
        extractedStatus,
      } as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source', id] });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      setDirty(false);
      toast.success('Source saved');
    },
    onError: () => { toast.error('Failed to save source'); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSource(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      toast.success('Source deleted');
      navigate('/sources');
    },
    onError: () => { toast.error('Failed to delete source'); },
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileOk, setFileOk] = useState<boolean | null>(null);

  const fileUrl = source?.originalFileKey ? getSourceFileUrl(id!) : null;

  useEffect(() => {
    if (!fileUrl) return;
    setFileOk(null);
    fetch(fileUrl, { method: 'HEAD' }).then(r => setFileOk(r.ok)).catch(() => setFileOk(false));
  }, [fileUrl]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }
  if (!source) {
    return <div className="p-8 text-center text-gray-400">Source not found</div>;
  }

  const markDirty = () => { if (!dirty) setDirty(true); };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sources')}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <h1 className="text-xl font-semibold flex-1 truncate" style={{ color: 'var(--navy)' }}>
          {source.title}
        </h1>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ background: 'var(--navy)' }}
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Metadata</h2>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Type</span>
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value as SourceType); markDirty(); }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  {SOURCE_TYPES.filter((t) => t.value !== 'all').map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-500">Extracted Status</span>
                <select
                  value={extractedStatus}
                  onChange={(e) => { setExtractedStatus(e.target.value as ExtractedStatus); markDirty(); }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  {EXTRACTED_STATUS_OPTIONS.filter((s) => s.value !== 'all').map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Paper</span>
                <select
                  value={paper}
                  onChange={(e) => { setPaper(e.target.value === '' ? '' : Number(e.target.value)); markDirty(); }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  <option value="">--</option>
                  {[1, 2, 3, 4].map((p) => (
                    <option key={p} value={p}>Paper {p}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-500">Year</span>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => { setYear(e.target.value === '' ? '' : Number(e.target.value)); markDirty(); }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  placeholder="e.g. 2024"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-500">Origin</span>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => { setOrigin(e.target.value); markDirty(); }}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  placeholder="e.g. hkeaa.edu.hk"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Tags (comma-separated)</span>
              <input
                type="text"
                value={tags}
                onChange={(e) => { setTags(e.target.value); markDirty(); }}
                className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </label>

            <div className="text-xs text-gray-400 space-y-1">
              <div>Format: {source.format}</div>
              {source.originalFileName && <div>File: {source.originalFileName}</div>}
              {source.originalFileSize && <div>Size: {(source.originalFileSize / (1024 * 1024)).toFixed(2)} MB</div>}
              <div>Created: {new Date(source.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {source.notes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Linked Notes</h2>
              {source.notes.map((note) => (
                <button
                  key={note._id}
                  onClick={() => navigate(noteUrl(note))}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  style={{ color: 'var(--navy)' }}
                >
                  <ExternalLink size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{note.title}</span>
                  <span className="text-xs text-gray-400 ml-auto">P{note.paper}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {fileUrl && source.format === 'pdf' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">File Preview</h2>
                {fileOk && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Download size={12} /> Download
                  </a>
                )}
              </div>
              {fileOk === null && (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                  Checking file...
                </div>
              )}
              {fileOk === false && (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileX size={28} className="text-gray-300" />
                  <p className="text-sm text-gray-400">File not available</p>
                </div>
              )}
              {fileOk && (
                <iframe
                  src={fileUrl}
                  className="w-full border-0"
                  style={{ height: '500px' }}
                  title="PDF Preview"
                />
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-700">Extracted Text</h2>
                <div className="flex rounded-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      viewMode === 'raw'
                        ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                        : 'bg-white text-gray-500 border-r border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setViewMode('rendered')}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      viewMode === 'rendered'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Rendered
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {extractedText.length.toLocaleString()} chars
              </span>
            </div>
            {viewMode === 'raw' ? (
              <textarea
                value={extractedText}
                onChange={(e) => { setExtractedText(e.target.value); markDirty(); }}
                className="w-full h-96 px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Paste or edit extracted text here..."
              />
            ) : (
              <div
                className="md-content h-96 overflow-y-auto px-3 py-2 text-sm border border-gray-200 rounded-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete source"
        message="Delete this source permanently? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => { setDeleteConfirmOpen(false); deleteMutation.mutate(); }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
