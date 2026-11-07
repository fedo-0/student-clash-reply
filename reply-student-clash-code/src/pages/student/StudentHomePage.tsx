import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bot, BookOpenCheck, Briefcase, CalendarDays, GraduationCap, Sparkles, Target, Theater, BookMarked } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useExamRecords, useOpportunities, useStudentCourses, useStudentGoal } from '@/data/hooks';
import { ai, type Recommendation } from '@/ai/client';
import { PageHeader, LoadingBlock, StatCard } from '@/components/common';
import { ReadinessRing, TrendBadge, BandBadge } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { weightedAverage, graduationBase, earnedCfu } from '@/lib/grades';
import { trendOf } from '@/lib/readiness';
import { daysUntil, fmtCountdown, fmtDate, today } from '@/lib/dates';
import { fmt } from '@/lib/utils';

const ACTION_ICON: Record<Recommendation['action'], typeof Bot> = { tutor: Bot, quiz: BookOpenCheck, simulation: Theater, review: BookMarked };
const OPP_LABEL = { internship: 'Tirocinio', job: 'Lavoro', event: 'Evento', scholarship: 'Borsa' } as const;

export function StudentHomePage() {
  const user = useCurrentUser();
  const { data: courses, isLoading } = useStudentCourses(user.id);
  const { data: records } = useExamRecords(user.id);
  const { data: goal } = useStudentGoal(user.id);
  const { data: opps } = useOpportunities(user.id);

  const recs = useQuery({
    queryKey: ['ai-recs', user.id, courses?.map((c) => c.readiness.readiness).join()],
    enabled: !!courses,
    queryFn: () =>
      ai.recommendations({
        studentName: user.full_name,
        courses: courses!.map((c) => ({ id: c.course.id, name: c.course.name, readiness: c.readiness, daysToExam: daysUntil(c.nextSession?.date) })),
      }),
  });

  const avg = records ? weightedAverage(records) : 0;
  const target = goal?.target_average ?? 0;
  const firstName = user.full_name.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow={fmtDate(today().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`Ciao ${firstName} 👋`}
        description="Ecco a che punto sei con i tuoi esami e cosa conviene fare oggi."
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Media ponderata" icon={GraduationCap} value={records ? fmt(avg, 2) : '—'} hint={target ? `Obiettivo ${fmt(target, 1)}` : undefined} />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">Verso l'obiettivo <Target className="h-4 w-4" /></div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{target ? `${fmt(avg, 2)} → ${fmt(target, 1)}` : '—'}</div>
            <Progress className="mt-3" value={target ? Math.min(100, ((avg - 18) / (target - 18)) * 100) : 0} />
          </CardContent>
        </Card>
        <StatCard label="Voto di laurea di partenza" value={records ? `${fmt(graduationBase(avg), 1)}/110` : '—'} hint="media × 110 / 30" />
        <StatCard label="CFU acquisiti" value={records ? earnedCfu(records) : '—'} hint={`${records?.filter((r) => !r.passed_at).length ?? 0} esami da sostenere`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Prossimi esami */}
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prossimi esami</h2>
            <Button variant="link" size="sm" asChild><Link to="/student/grades">Libretto <ArrowRight /></Link></Button>
          </div>
          {isLoading ? <LoadingBlock rows={2} /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses?.map((c) => {
                const days = daysUntil(c.nextSession?.date);
                const worst = [...c.readiness.items].filter((i) => i.practiced).sort((a, b) => a.score - b.score)[0];
                return (
                  <Link key={c.course.id} to={`/student/exams/${c.course.id}`} className="group">
                    <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
                      <CardContent className="flex gap-4 p-5">
                        <ReadinessRing value={c.readiness.readiness} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold leading-tight">{c.course.name}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {c.nextSession ? `${fmtDate(c.nextSession.date)} · ${fmtCountdown(days)}` : 'Nessun appello'}
                          </div>
                          <div className="mt-2"><TrendBadge delta={trendOf(c.trend, 2)} period="in 2 settimane" /></div>
                          {worst && worst.band === 'gap' && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              <BandBadge band="gap" /> <span className="text-muted-foreground">{worst.topic.name}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Opportunità */}
          <div className="mb-3 mt-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Opportunità per te</h2>
            <Button variant="link" size="sm" asChild><Link to="/student/opportunities">Vedi tutte <ArrowRight /></Link></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {opps ? opps.slice(0, 2).map((o) => (
              <Card key={o.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" /> {OPP_LABEL[o.kind]} · {o.organization}
                    <Badge variant="secondary" className="ml-auto">{Math.round(o.score * 100)}% match</Badge>
                  </div>
                  <div className="mt-2 font-medium">{o.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{o.reasons[0]}</div>
                </CardContent>
              </Card>
            )) : <><Skeleton className="h-28" /><Skeleton className="h-28" /></>}
          </div>
        </section>

        {/* Colonna destra */}
        <aside className="space-y-6">
          <Card className="border-primary/30 bg-gradient-to-b from-accent/60 to-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Oggi ti consiglio</CardTitle>
              <CardDescription>Suggerimenti AI basati sulla tua preparazione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.isLoading || !recs.data ? <><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></> :
                recs.data.map((r) => {
                  const Icon = ACTION_ICON[r.action];
                  return (
                    <Link key={r.id} to={r.link} className="flex gap-3 rounded-md border bg-card p-3 transition-colors hover:border-primary">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{r.title} <span className="font-normal text-muted-foreground">· {r.minutes} min</span></div>
                        <div className="text-xs text-muted-foreground">{r.reason}</div>
                      </div>
                    </Link>
                  );
                })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Theater className="h-4 w-4" /> Simulatore di consulenza</CardTitle>
              <CardDescription>Preparati a un esame applicandone gli argomenti a un caso reale, con un cliente interpretato dall'AI. Il risultato aggiorna il tuo livello.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild><Link to="/student/roleplay">Inizia una simulazione <ArrowRight /></Link></Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
