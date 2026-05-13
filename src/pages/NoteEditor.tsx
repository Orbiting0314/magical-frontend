import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { getNote, updateNote } from '../api/notes';
import { markdownToHtml, htmlToMarkdown } from '../lib/serializer';
import { PAPER_NAMES, TOPIC_NAMES } from '../types';
import EditorToolbar from '../components/editor/EditorToolbar';
import PdfPreview from '../components/editor/PdfPreview';
import { useAutoSave } from '../components/editor/useAutoSave';

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
      },
    },
  }, [initialHtml]);

  const getMarkdown = useCallback(() => {
    if (!editor) return note?.markdown || '';
    const html = editor.getHTML();
    return htmlToMarkdown(html, metadataRef.current);
  }, [editor, note?.markdown]);

  const { status: saveStatus, save, markDirty } = useAutoSave({
    noteId: id!,
    getMarkdown,
  });

  // Wire editor updates to auto-save
  useMemo(() => {
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
      </div>

      {/* Split pane */}
      <div className="flex gap-4 h-[calc(100%-2.5rem)]">
        {/* Editor pane (60%) */}
        <div className="w-3/5 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          <EditorToolbar
            editor={editor}
            onSave={save}
            saveStatus={saveStatus}
            noteStatus={note.status}
            onStatusToggle={handleStatusToggle}
          />
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Preview pane (40%) */}
        <div className="w-2/5">
          <PdfPreview
            getMarkdown={getMarkdown}
            level={note.level}
            title={note.title}
          />
        </div>
      </div>
    </div>
  );
}
