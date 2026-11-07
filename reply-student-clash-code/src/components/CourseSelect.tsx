import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Course } from '@/types/database';
import { cn } from '@/lib/utils';

/** Selettore corso basato sul query param ?course= (condivisibile via URL). */
export function useSelectedCourse(courses: Course[] | undefined) {
  const [params, setParams] = useSearchParams();
  const selected = params.get('course') ?? courses?.[0]?.id;
  useEffect(() => {
    if (!params.get('course') && courses?.[0]) setParams((p) => { p.set('course', courses[0].id); return p; }, { replace: true });
  }, [courses, params, setParams]);
  const select = (id: string) => setParams((p) => { p.set('course', id); return p; });
  return { courseId: selected, select, course: courses?.find((c) => c.id === selected) };
}

export function CourseTabs({ courses, value, onChange }: { courses: Course[]; value?: string; onChange: (id: string) => void }) {
  if (courses.length <= 1) return null;
  return (
    <div className="inline-flex rounded-md bg-muted p-1">
      {courses.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn('rounded-sm px-3 py-1.5 text-sm font-medium transition-all', value === c.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
