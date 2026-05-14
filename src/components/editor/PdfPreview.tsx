import { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Download, Loader2, RefreshCw } from 'lucide-react';
import api from '../../api/client';

interface PdfPreviewProps {
  getMarkdown: () => string;
  level: string;
  title: string;
  paper?: number;
  topic?: string;
}

type Phase = 'idle' | 'preparing' | 'rendering' | 'done';

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  preparing: 'Preparing...',
  rendering: 'Rendering PDF...',
  done: '',
};

const AUTO_REFRESH_DELAY = 4000;

function buildFilename(title: string, paper?: number, topic?: string, level?: string): string {
  const parts: string[] = [];
  if (paper) parts.push(`P${paper}`);
  if (topic) parts.push(topic);
  if (level && level !== 'all') parts.push(`Lev-${level}`);
  parts.push(title);
  return parts.join('_').replace(/[^a-zA-Z0-9_+-]/g, '_').replace(/_+/g, '_');
}

export default function PdfPreview({ getMarkdown, level, title, paper, topic }: PdfPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const prevUrlRef = useRef<string | null>(null);
  const cachedHashRef = useRef<string>('');
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const renderPreview = useCallback(async (force = false) => {
    const markdown = getMarkdown();
    const hash = simpleHash(markdown + level);

    if (!force && hash === cachedHashRef.current && previewUrl) return;

    setPhase('preparing');
    setError('');
    try {
      setPhase('rendering');
      const response = await api.post('/render/preview', {
        markdown,
        level,
      }, { responseType: 'blob' });

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(response.data);
      prevUrlRef.current = url;
      cachedHashRef.current = hash;
      setPreviewUrl(url);
      setPhase('done');
      dirtyRef.current = false;
      setTimeout(() => setPhase('idle'), 800);
    } catch {
      setError('Preview failed. Try again.');
      setPhase('idle');
    }
  }, [getMarkdown, level, previewUrl]);

  const scheduleAutoRefresh = useCallback(() => {
    if (!autoRefresh) return;
    dirtyRef.current = true;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => {
      if (dirtyRef.current) renderPreview();
    }, AUTO_REFRESH_DELAY);
  }, [autoRefresh, renderPreview]);

  useEffect(() => {
    if (!autoRefresh) return;
    const observer = new MutationObserver(() => scheduleAutoRefresh());
    const editorEl = document.querySelector('.prose-editor');
    if (editorEl) {
      observer.observe(editorEl, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      observer.disconnect();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [autoRefresh, scheduleAutoRefresh]);

  async function handleDownload() {
    setPhase('rendering');
    setError('');
    try {
      const response = await api.post('/render/download', {
        markdown: getMarkdown(),
        level,
        filename: title,
      }, { responseType: 'blob' });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${buildFilename(title, paper, topic, level)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed. Try again.');
    } finally {
      setPhase('idle');
    }
  }

  const isLoading = phase === 'preparing' || phase === 'rendering';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #f0e8e0' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: '#f0e8e0', background: 'var(--cream)' }}>
        <button
          onClick={() => renderPreview(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--navy)' }}
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          Preview
        </button>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          Download
        </button>

        <div className="flex-1" />

        {PHASE_LABELS[phase] && (
          <span className="text-[11px] animate-pulse" style={{ color: 'var(--pink-dark)' }}>{PHASE_LABELS[phase]}</span>
        )}

        {phase === 'done' && (
          <span className="text-[11px] text-emerald-600">Done</span>
        )}

        {error && <span className="text-[11px] text-red-500">{error}</span>}

        <button
          onClick={() => setAutoRefresh(v => !v)}
          title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
            autoRefresh
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <RefreshCw size={11} />
          Auto
        </button>
      </div>

      <div className="flex-1 bg-gray-100">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Click Preview to render the PDF
          </div>
        )}
      </div>
    </div>
  );
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return String(hash);
}
