import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Undo2, Redo2, Save, ImagePlus,
} from 'lucide-react';
import MemePicker from './MemePicker';
import type { Meme } from '../../types';

interface ToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  noteStatus: 'draft' | 'published';
  onStatusToggle: () => void;
}

function Btn({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

export default function EditorToolbar({ editor, onSave, saveStatus, noteStatus, onStatusToggle }: ToolbarProps) {
  const [memePickerOpen, setMemePickerOpen] = useState(false);

  if (!editor) return null;

  function handleMemeSelect(meme: Meme) {
    editor!.chain().focus().setImage({ src: meme.url, alt: meme.name }).run();
  }

  return (
    <>
    <MemePicker
      open={memePickerOpen}
      onClose={() => setMemePickerOpen(false)}
      onSelect={handleMemeSelect}
    />
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-200 bg-white rounded-t-xl">
      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold size={15} />
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic size={15} />
      </Btn>
      <Btn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={15} />
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 size={15} />
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 size={15} />
      </Btn>

      <Sep />

      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={15} />
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered size={15} />
      </Btn>

      <Sep />

      <Btn
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo2 size={15} />
      </Btn>
      <Btn
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo2 size={15} />
      </Btn>

      <Sep />

      <Btn
        onClick={() => setMemePickerOpen(true)}
        title="Insert Meme"
      >
        <ImagePlus size={15} />
      </Btn>

      <div className="flex-1" />

      <span className={`text-xs mr-3 ${
        saveStatus === 'saved' ? 'text-emerald-600' :
        saveStatus === 'saving' ? 'text-amber-600' :
        'text-gray-400'
      }`}>
        {saveStatus === 'saved' ? 'Saved' :
         saveStatus === 'saving' ? 'Saving...' :
         'Unsaved changes'}
      </span>

      <button
        onClick={onStatusToggle}
        className={`px-2.5 py-1 rounded text-xs font-medium mr-2 transition-colors ${
          noteStatus === 'published'
            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {noteStatus === 'published' ? 'Published' : 'Draft'}
      </button>

      <button
        onClick={onSave}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
        style={{ background: 'var(--gold-dark)' }}
      >
        <Save size={13} />
        Save
      </button>
    </div>
    </>
  );
}
