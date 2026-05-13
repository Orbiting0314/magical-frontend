import { useState, useRef, useEffect } from 'react';
import { Eye, Download, Loader2 } from 'lucide-react';
import api from '../../api/client';

interface PdfPreviewProps {
  getMarkdown: () => string;
  level: string;
  title: string;
}

export default function PdfPreview({ getMarkdown, level, title }: PdfPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  async function handlePreview() {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/render/preview', {
        markdown: getMarkdown(),
        level,
      }, { responseType: 'blob' });

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(response.data);
      prevUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setError('Preview failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setLoading(true);
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
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--navy)' }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          Preview
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          Download
        </button>
        {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
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
