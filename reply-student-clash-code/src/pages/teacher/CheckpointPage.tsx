import { useQuery } from '@tanstack/react-query';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useCourseAggregates, useTeacherCourses } from '@/data/hooks';
import { ai } from '@/ai/client';
import { CourseTabs, useSelectedCourse } from '@/components/CourseSelect';
import { PageHeader, LoadingBlock } from '@/components/common';
import { BAND_BG, BandLegend } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Band } from '@/lib/mastery';
import { cn } from '@/lib/utils';

const ORDER: Band[] = ['gap', 'consolidating', 'mastered', 'unverified'];

export function CheckpointPage() {
  const user = useCurrentUser();
  const { data: courses } = useTeacherCourses(user.id);
  const { courseId, select } = useSelectedCourse(courses);
  const { data: ag } = useCourseAggregates(courseId);
  const suggestions = useQuery({
    queryKey: ['ai-lesson', courseId, ag?.avgReadiness],
    enabled: !!ag,
    queryFn: () => ai.lessonSuggestions({ courseName: ag!.course.name, distributions: ag!.distributions }),
  });

  const modules = ag ? [...new Set(ag.distributions.map((d) => d.module ?? 'Altro'))] : [];

  return (
    <>
      <PageHeader title="Checkpoint" description="Fotografia della classe per modulo e suggerimenti AI per calibrare la prossima lezione." actions={courses && <CourseTabs courses={courses} value={courseId} onChange={select} />} />
      {!ag ? <LoadingBlock rows={3} /> : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {modules.map((m) => (
              <Card key={m}>
                <CardHeader><CardTitle>{m}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {ag.distributions.filter((d) => (d.module ?? 'Altro') === m).map((d) => (
                    <div key={d.topicId}>
                      <div className="mb-1 flex justify-between text-sm"><span>{d.topicName}</span><span className="tabular-nums text-muted-foreground">media {Math.round(d.avgScore)}</span></div>
                      <div className="flex h-3 overflow-hidden rounded-full">
                        {ORDER.map((b) => <div key={b} className={cn(BAND_BG[b])} style={{ width: `${(d.counts[b] / ag.studentsCount) * 100}%` }} />)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            <BandLegend />
          </div>
          <Card className="h-fit border-primary/30 lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Per la prossima lezione</CardTitle><CardDescription>Generati dall'AI a partire dagli aggregati della classe</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {!suggestions.data ? <><Skeleton className="h-24" /><Skeleton className="h-24" /></> : suggestions.data.map((s) => (
                <div key={s.topic} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">{s.topic}</div>
                  <div className="text-xs text-muted-foreground">{s.insight}</div>
                  <p className="mt-2">{s.suggestion}</p>
                  <p className="mt-2 flex gap-2 rounded bg-accent/60 p-2 text-xs"><Lightbulb className="h-3.5 w-3.5 shrink-0 text-primary" /> {s.example}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
