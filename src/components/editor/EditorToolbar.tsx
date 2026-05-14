import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Undo2, Redo2, Save, ImagePlus,
  LayoutGrid, ChevronDown, Library, Keyboard, Upload, X,
} from 'lucide-react';
import MemePicker from './MemePicker';
import ComponentPicker from './ComponentPicker';
import type { Meme } from '../../types';

interface ContainerDef {
  type: string;
  label: string;
  desc: string;
  attrs?: Record<string, string | number>;
  placeholder: string;
  color: string;
}

const CONTAINERS: ContainerDef[] = [
  { type: 'skill', label: 'Key Skill', desc: 'Technique or strategy', attrs: { icon: 'melody' }, placeholder: 'Describe the key technique...', color: '#F4A7BB' },
  { type: 'warning', label: 'Common Mistake', desc: 'What to avoid', attrs: { icon: 'kuromi' }, placeholder: 'Describe the common mistake...', color: '#E8A0A0' },
  { type: 'hkeaa', label: 'HKEAA Remarks', desc: 'Examiner quote or note', attrs: { year: 2024 }, placeholder: 'Paste HKEAA examiner remark...', color: '#C9A962' },
  { type: 'training', label: 'Training', desc: 'Practice space for students', attrs: { lines: 6 }, placeholder: 'Write the practice prompt...', color: '#CCC' },
  { type: 'answer', label: 'Model Answer', desc: 'Sample or model response', placeholder: 'Write the model answer...', color: '#999' },
  { type: 'question', label: 'Past Paper Question', desc: 'HKDSE question reference', attrs: { year: 2024, paper: 1 }, placeholder: 'Paste or describe the question...', color: '#2C3E50' },
  { type: 'level-compare', label: 'Level Compare', desc: 'Side-by-side 3/4/5 comparison', placeholder: 'Add level comparison content...', color: '#4A6FA5' },
  { type: 'rubric', label: 'Rubric', desc: 'Marking criteria table', placeholder: 'Add marking criteria...', color: '#2C3E50' },
  { type: 'phrases', label: 'Phrase Bank', desc: 'Useful phrases collection', attrs: { title: 'Useful Phrases' }, placeholder: 'Add phrases...', color: '#C9A962' },
  { type: 'exam-sample', label: 'Exam Sample', desc: 'Past paper sample reference', attrs: { year: 2024, paper: 2 }, placeholder: 'Add exam sample content...', color: '#666' },
];

interface ToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  noteStatus: 'draft' | 'published';
  onStatusToggle: () => void;
  onComponentInserted: (componentId: string) => void;
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
          ? 'text-gray-900'
          : 'hover:text-gray-700'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      style={{
        color: active ? 'var(--pink-dark)' : undefined,
        background: active ? 'var(--pink-light)' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

function buildContainerHtml(def: ContainerDef): string {
  const attrsJson = def.attrs ? ` data-attrs='${JSON.stringify(def.attrs)}'` : '';
  return (
    `<div data-container="${def.type}"${attrsJson}>` +
    `<div data-container-label="${def.type}">${def.label}</div>` +
    `<p>${def.placeholder}</p>` +
    `</div>`
  );
}

function ContainerDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function insert(def: ContainerDef) {
    editor.chain().focus().insertContent(buildContainerHtml(def)).run();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Insert Container Block"
        className="flex items-center gap-0.5 px-1.5 py-1 rounded transition-colors hover:text-gray-700"
        style={{
          color: open ? 'var(--pink-dark)' : undefined,
          background: open ? 'var(--pink-light)' : undefined,
        }}
      >
        <LayoutGrid size={15} />
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Insert Container
          </div>
          {CONTAINERS.map(def => (
            <button
              key={def.type}
              type="button"
              onClick={() => insert(def)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: def.color }}
              />
              <span className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 block leading-tight">{def.label}</span>
                <span className="text-[11px] text-gray-400 block leading-tight">{def.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: 'saved' | 'saving' | 'unsaved' }) {
  const [flash, setFlash] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current === 'saving' && status === 'saved') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);

  return (
    <span
      className={`text-xs mr-3 px-2 py-0.5 rounded transition-all duration-300 ${
        flash
          ? 'bg-emerald-100 text-emerald-700 font-medium'
          : status === 'saved' ? 'text-emerald-600'
          : status === 'saving' ? 'text-amber-600'
          : 'text-gray-400'
      }`}
    >
      {status === 'saved' ? 'Saved' :
       status === 'saving' ? 'Saving...' :
       'Unsaved changes'}
    </span>
  );
}

const SHORTCUTS = [
  ['Bold', 'Ctrl + B'],
  ['Italic', 'Ctrl + I'],
  ['Strikethrough', 'Ctrl + Shift + X'],
  ['Heading 2', 'Ctrl + Alt + 2'],
  ['Heading 3', 'Ctrl + Alt + 3'],
  ['Bullet List', 'Ctrl + Shift + 8'],
  ['Ordered List', 'Ctrl + Shift + 7'],
  ['Undo', 'Ctrl + Z'],
  ['Redo', 'Ctrl + Shift + Z'],
  ['Save', 'Ctrl + S'],
];

function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  function fmt(shortcut: string) {
    if (isMac) return shortcut.replace(/Ctrl/g, 'Cmd').replace(/Alt/g, 'Option');
    return shortcut;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>
        <div className="px-4 py-2 divide-y divide-gray-50">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">{action}</span>
              <kbd className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-mono text-gray-500">{fmt(keys)}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EditorToolbar({ editor, onSave, saveStatus, noteStatus, onStatusToggle, onComponentInserted }: ToolbarProps) {
  const [memePickerOpen, setMemePickerOpen] = useState(false);
  const [componentPickerOpen, setComponentPickerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onSave]);

  if (!editor) return null;

  function handleMemeSelect(meme: Meme) {
    editor!.chain().focus().setImage({ src: meme.url, alt: meme.name }).run();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      editor!.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <>
    <MemePicker
      open={memePickerOpen}
      onClose={() => setMemePickerOpen(false)}
      onSelect={handleMemeSelect}
    />
    <ComponentPicker
      open={componentPickerOpen}
      onClose={() => setComponentPickerOpen(false)}
      editor={editor}
      onInserted={onComponentInserted}
    />
    <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b rounded-t-xl" style={{ background: 'var(--cream)', borderColor: '#f0e8e0' }}>
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
      <Btn
        onClick={() => fileInputRef.current?.click()}
        title="Upload Image"
      >
        <Upload size={15} />
      </Btn>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <Sep />

      <ContainerDropdown editor={editor} />

      <Sep />

      <Btn
        onClick={() => setComponentPickerOpen(true)}
        title="Insert from Knowledge Base"
      >
        <Library size={15} />
      </Btn>

      <Sep />

      <Btn
        onClick={() => setShortcutsOpen(true)}
        title="Keyboard Shortcuts"
      >
        <Keyboard size={15} />
      </Btn>

      <div className="flex-1" />

      <SaveIndicator status={saveStatus} />

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
        className="btn-pink flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
      >
        <Save size={13} />
        Save
      </button>
    </div>
    </>
  );
}
