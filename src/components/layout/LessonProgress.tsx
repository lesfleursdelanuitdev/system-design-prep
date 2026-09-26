'use client';
import { useEffect } from 'react';
import { useProgress } from '@/lib/progress';
import { useHydrated } from '@/lib/storage';
import { IconCheck } from '../icons';

/** “Mark as complete” at the end of a lesson. Also remembers this as the last lesson opened. */
export function CompleteButton({ lessonId }: { lessonId: string }) {
  const { progress, setComplete, setLast } = useProgress();
  const hydrated = useHydrated();
  const done = hydrated && !!progress.completed[lessonId];

  useEffect(() => {
    setLast(lessonId);
  }, [lessonId, setLast]);

  return (
    <button
      type="button"
      className={`btn ${done ? '!border-good !bg-good-soft !text-good' : 'btn-primary'}`}
      aria-pressed={done}
      onClick={() => setComplete(lessonId, !done)}
    >
      <IconCheck />
      {done ? 'Completed' : 'Mark this lesson complete'}
    </button>
  );
}
