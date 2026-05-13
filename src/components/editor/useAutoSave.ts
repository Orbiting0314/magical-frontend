import { useRef, useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateNote } from '../../api/notes';

interface UseAutoSaveOptions {
  noteId: string;
  getMarkdown: () => string;
  delay?: number;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export function useAutoSave({ noteId, getMarkdown, delay = 3000 }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMarkdownRef = useRef<string>('');

  const mutation = useMutation({
    mutationFn: (markdown: string) => updateNote(noteId, { markdown }),
    onMutate: () => setStatus('saving'),
    onSuccess: () => setStatus('saved'),
    onError: () => setStatus('unsaved'),
  });

  const save = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const markdown = getMarkdown();
    latestMarkdownRef.current = markdown;
    mutation.mutate(markdown);
  }, [getMarkdown, mutation]);

  const markDirty = useCallback(() => {
    setStatus('unsaved');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const markdown = getMarkdown();
      latestMarkdownRef.current = markdown;
      mutation.mutate(markdown);
    }, delay);
  }, [getMarkdown, mutation, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { status, save, markDirty };
}
