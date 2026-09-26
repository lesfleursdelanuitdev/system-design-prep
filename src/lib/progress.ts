'use client';
import { useCallback } from 'react';
import { z } from 'zod';
import { useStored } from './storage';

const progressSchema = z.object({
  /** lesson id → ISO date it was marked complete */
  completed: z.record(z.string().max(200), z.string().max(40)).default({}),
  /** the lesson most recently opened */
  last: z.string().max(200).optional(),
});
export type Progress = z.infer<typeof progressSchema>;

const EMPTY: Progress = { completed: {} };

export function useProgress() {
  const [progress, setProgress] = useStored('progress', progressSchema, EMPTY);

  const setComplete = useCallback(
    (lessonId: string, done: boolean) =>
      setProgress((p) => {
        const completed = { ...p.completed };
        if (done) completed[lessonId] = new Date().toISOString();
        else delete completed[lessonId];
        return { ...p, completed };
      }),
    [setProgress],
  );

  const setLast = useCallback(
    (lessonId: string) => setProgress((p) => (p.last === lessonId ? p : { ...p, last: lessonId })),
    [setProgress],
  );

  return { progress, setComplete, setLast };
}
