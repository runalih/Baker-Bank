import { useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions<T> {
  enabled: boolean;
  delay?: number;
  onSave: (value: T) => Promise<void>;
}

interface UseAutosaveResult {
  status: AutosaveStatus;
  error: string | null;
  flush: () => Promise<void> | undefined;
}

/**
 * Debounce-saves `value` via `onSave` whenever it changes (skips the initial
 * mount so loading existing data doesn't trigger a save). Also flushes any
 * pending save on unmount, so navigating away right after typing doesn't
 * drop the change.
 */
export function useAutosave<T>(value: T, { enabled, delay = 900, onSave }: UseAutosaveOptions<T>): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const valueRef = useRef(value);
  valueRef.current = value;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstRef = useRef(true);
  const saveTokenRef = useRef(0);

  const runSaveRef = useRef<(() => Promise<void> | undefined) | undefined>(undefined);
  if (!runSaveRef.current) {
    runSaveRef.current = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!enabledRef.current) return undefined;
      const token = ++saveTokenRef.current;
      setStatus('saving');
      const promise = onSaveRef.current(valueRef.current);
      promise.then(
        () => {
          if (saveTokenRef.current === token) {
            setStatus('saved');
            setError(null);
          }
        },
        (err) => {
          if (saveTokenRef.current === token) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Could not save');
          }
        }
      );
      return promise;
    };
  }

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => runSaveRef.current?.(), delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), enabled, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) runSaveRef.current?.();
    };
  }, []);

  return { status, error, flush: () => runSaveRef.current?.() };
}
