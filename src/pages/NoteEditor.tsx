import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { getNote, updateNote, restoreNoteVersion } from '../api/notes';
import { markdownToHtml, htmlToMarkdown } from '../lib/serializer';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';
import EditorToolbar from '../components/editor/EditorToolbar';
import PdfPreview from '../components/editor/PdfPreview';
import VersionHistory from '../components/editor/VersionHistory';
import { useAutoSave } from '../components/editor/useAutoSave';

const SPLIT_MIN = 30;
const SPLIT_MAX = 80;
const SPLIT_DEFAULT = 60;

function SplitPane({ children }: { children: [React.ReactElement, React.ReactElement] }) {
  const [splitPct, setSplitPct] = useState(SPLIT_DEFAULT);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMove(ev: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)));
    }

    function onUp() {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div ref={containerRef} className="flex h-[calc(100%-2.5rem)] split-pane-horizontal">
      <div style={{ width: `${splitPct}%` }} className="min-w-0">
        {children[0]}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="w-2 flex-shrink-0 cursor-col-resize group relative split-pane-divider"
      >
        <div className="absolute inset-y-0 left-0.5 w-1 rounded-full transition-colors" style={{ background: 'var(--pink-light)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pink)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--pink-light)')}
        />
      </div>
      <div style={{ width: `${100 - splitPct}%` }} className="min-w-0">
        {children[1]}
      </div>
    </div>
  );
}

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metadataRef = useRef<string[]>([]);

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => getNote(id!),
    enabled: !!id,
  });

  const initialHtml = useMemo(() => {
    if (!note?.markdown) return '';
    const { html, metadataLines } = markdownToHtml(note.markdown);
    metadataRef.current = metadataLines;
    return html;
  }, [note?.markdown]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'md-content prose-editor outline-none min-h-[60vh] px-6 py-4',
        spellcheck: 'true',
      },
    },
  }, [initialHtml]);

  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });
  useEffect(() => {
    if (!editor) return;
    function update() {
      const text = editor!.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount({ words, chars: text.length });
    }
    update();
    editor.on('update', update);
    return () => { editor.off('update', update); };
  }, [editor]);

  const getMarkdown = useCallback(() => {
    if (!editor) return note?.markdown || '';
    const html = editor.getHTML();
    return htmlToMarkdown(html, metadataRef.current);
  }, [editor, note?.markdown]);

  const { status: saveStatus, save, markDirty } = useAutoSave({
    noteId: id!,
    getMarkdown,
  });

  useEffect(() => {
    if (!editor) return;
    editor.on('update', markDirty);
    return () => {
      editor.off('update', markDirty);
    };
  }, [editor, markDirty]);

  const statusMutation = useMutation({
    mutationFn: (newStatus: 'draft' | 'published') =>
      updateNote(id!, { status: newStatus }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['note', id], updated);
    },
  });

  function handleStatusToggle() {
    if (!note) return;
    const newStatus = note.status === 'published' ? 'draft' : 'published';
    statusMutation.mutate(newStatus);
  }

  const [historyOpen, setHistoryOpen] = useState(false);

  function handleComponentInserted(componentId: string) {
    if (!id) return;
    updateNote(id, { addComponentUsed: [componentId] }).then((updated) => {
      queryClient.setQueryData(['note', id], updated);
    });
    markDirty();
  }

  function handleRestore(versionId: string) {
    if (!id) return;
    restoreNoteVersion(id, versionId).then((updated) => {
      queryClient.setQueryData(['note', id], updated);
      queryClient.invalidateQueries({ queryKey: ['note-versions', id] });
      setHistoryOpen(false);
    });
  }

  if (isLoading) {
    return <div className="text-gray-400 text-sm py-8 text-center">Loading note...</div>;
  }

  if (!note) {
    return <div className="text-gray-400 text-sm py-8 text-center">Note not found</div>;
  }

  return (
    <div className="space-y-3 h-[calc(100vh-7rem)]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Notes
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-500">
          {PAPER_NAMES[note.paper] ? `P${note.paper}` : `Paper ${note.paper}`}
        </span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-500">
          {TOPIC_NAMES[note.topic] || note.topic}
        </span>
        <span className="text-gray-300">/</span>
        <span style={{ color: 'var(--navy)' }} className="font-medium">
          {note.title}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setHistoryOpen(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
          style={historyOpen
            ? { background: 'var(--pink-light)', color: 'var(--pink-dark)' }
            : { color: 'var(--navy-light)' }
          }
        >
          <History size={13} />
          History
        </button>
      </div>

      {/* Split pane */}
      <div className="flex gap-3 h-[calc(100%-2.5rem)]">
      <div className={`flex-1 min-w-0 ${historyOpen ? '' : ''}`}>
      <SplitPane>
        {/* Editor pane */}
        <div className="flex flex-col bg-white rounded-xl overflow-hidden h-full" style={{ border: '1px solid #f0e8e0' }}>
          <EditorToolbar
            editor={editor}
            onSave={save}
            saveStatus={saveStatus}
            noteStatus={note.status}
            onStatusToggle={handleStatusToggle}
            onComponentInserted={handleComponentInserted}
          />
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
          <div className="flex items-center justify-end gap-3 px-4 py-1.5 border-t text-[11px]" style={{ borderColor: '#f0e8e0', color: 'var(--navy-light)' }}>
            <span>{wordCount.words} words</span>
            <span>{wordCount.chars} chars</span>
          </div>
        </div>

        {/* Preview pane */}
        <PdfPreview
          getMarkdown={getMarkdown}
          level={note.level}
          title={note.title}
        />
      </SplitPane>
      </div>
      {historyOpen && (
        <div className="w-72 shrink-0 h-full">
          <VersionHistory
            noteId={id!}
            currentMarkdown={getMarkdown()}
            onRestore={handleRestore}
            onClose={() => setHistoryOpen(false)}
          />
        </div>
      )}
      </div>
    </div>
  );
}
