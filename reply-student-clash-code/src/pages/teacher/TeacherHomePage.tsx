import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, Info, Siren, Users } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useCourseAggregates, useTeacherAlerts, useTeacherCourses } from '@/data/hooks';
import type { Course } from '@/types/database';
import type { Alert } from '@/types/domain';
import { PageHeader, LoadingBlock } from '@/components/common';
import { ReadinessRing, TrendBadge, BandBadge } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { trendOf } from '@/lib/readiness';
import { daysUntil, fmtCountdown, fmtDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

const ALERT_STYLE: Record<Alert['severity'], { icon: typeof Info; cls: string }> = {
  critical: { icon: Siren, cls: 'border-band-gap/40 bg-band-gap/5 text-band-gap' },
  warning: { icon: AlertTriangle, cls: 'border-band-consolidating/40 bg-band-consolidating/5 text-band-consolidating' },
  info: { icon: Info, cls: 'border-border bg-muted/50 text-muted-foreground' },
};

function CourseCard({ course }: { course: Course }) {
  const { data: ag } = useCourseAggregates(course.id);
  if (!ag) return <Skeleton className="h-48" />;
  const worst = [...ag.distributions].sort((a, b) => b.pctGap - a.pctGap)[0];
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{course.name}</CardTitle>
        <CardDescription>{course.code} · {course.cfu} CFU · {course.degree_program}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-4">
          <ReadinessRing value={ag.avgReadiness} label="media" />
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {ag.activeStudents7d}/{ag.studentsCount} attivi questa settimana</div>
            <div><TrendBadge delta={trendOf(ag.readinessTrend, 2)} period="readiness in 2 sett." /></div>
            {ag.nextSession && <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Appello {fmtDate(ag.nextSession.date)} · {fmtCountdown(daysUntil(ag.nextSession.date))}</div>}
          </div>
        </div>
        {worst && worst.pctGap > 0.2 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/60 p-2.5 text-sm">
            <BandBadge band="gap" /> <span className="font-medium">{worst.topicName}</span>
            <span className="text-muted-foreground">{Math.round(worst.pctGap * 100)}% della classe</span>
          </div>
        )}
        <Button variant="outline" className="mt-auto" asChild><Link to={`/teacher/class?course=${course.id}`}>Overview classe <ArrowRight /></Link></Button>
      </CardContent>
    </Card>
  );
}

export function TeacherHomePage() {
  const user = useCurrentUser();
  const { data: courses, isLoading } = useTeacherCourses(user.id);
  const { data: alerts } = useTeacherAlerts(user.id);

  return (
    <>
      <PageHeader eyebrow={user.department} title={`Buongiorno, ${user.full_name}`} description="Lo stato di preparazione delle tue classi, aggiornato in tempo reale dalle attività degli studenti." />
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">I miei corsi</h2>
          {isLoading ? <LoadingBlock rows={2} /> : (
            <div className="grid gap-4 md:grid-cols-2">{courses?.map((c) => <CourseCard key={c.id} course={c} />)}</div>
          )}
        </section>
        <aside>
          <h2 className="mb-3 text-lg font-semibold">Alert AI</h2>
          <div className="space-y-3">
            {!alerts ? <LoadingBlock rows={3} /> : alerts.map((a) => {
              const s = ALERT_STYLE[a.severity];
              return (
                <Link key={a.id} to={a.id.startsWith('faq') ? `/teacher/faq?course=${a.courseId}` : `/teacher/class?course=${a.courseId}`} className={cn('flex gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md', s.cls)}>
                  <s.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{a.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.body}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}
