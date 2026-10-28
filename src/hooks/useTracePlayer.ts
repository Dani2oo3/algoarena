import { useCallback, useEffect, useState } from 'react';

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export function useTracePlayer<T>(delayMs: number) {
  const [events, setEvents] = useState<readonly T[]>([]);
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');

  useEffect(() => {
    if (status !== 'running') return;
    if (cursor >= events.length) {
      setStatus('completed');
      return;
    }
    const timer = window.setTimeout(() => {
      const next = cursor + 1;
      setCursor(next);
      if (next >= events.length) setStatus('completed');
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [cursor, delayMs, events.length, status]);

  const prepare = useCallback((trace: readonly T[]) => {
    setEvents(trace);
    setCursor(0);
    setStatus('idle');
  }, []);
  const play = useCallback(() => {
    if (events.length === 0) return;
    if (cursor >= events.length) setCursor(0);
    setStatus('running');
  }, [cursor, events.length]);
  const pause = useCallback(() => {
    if (status === 'running') setStatus('paused');
  }, [status]);
  const resume = useCallback(() => {
    if (status === 'paused') setStatus('running');
  }, [status]);
  const step = useCallback(() => {
    if (events.length === 0 || status === 'running' || status === 'completed') return;
    const next = Math.min(cursor + 1, events.length);
    setCursor(next);
    setStatus(next >= events.length ? 'completed' : 'paused');
  }, [cursor, events.length, status]);
  const reset = useCallback(() => {
    setCursor(0);
    setStatus('idle');
  }, []);

  return {
    events,
    cursor,
    status,
    progress: events.length === 0 ? 0 : Math.round((cursor / events.length) * 100),
    prepare,
    play,
    pause,
    resume,
    step,
    reset,
  };
}
