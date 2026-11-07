import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, RotateCcw, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useExamRecords, useStudentCourses, useStudentGoal, useUpdateGoal } from '@/data/hooks';
import { ai } from '@/ai/client';
import { PageHeader, LoadingBlock, StatCard, RichText } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { arithmeticAverage, earnedCfu, graduationBase, simulateGrades, weightedAverage } from '@/lib/grades';
import { readinessBand } from '@/components/mastery';
import { fmt, cn } from '@/lib/utils';
import { fmtDate } from '@/lib/dates';

/** Hook di debounce per non richiamare l'AI ad ogni movimento dello slider. */
function useDebounced<T>(value: T, ms = 500) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function GradesPage() {
  const user = useCurrentUser();
  const { data: records, isLoading } = useExamRecords(user.id);
  const { data: goal } = useStudentGoal(user.id);
  const { data: courses } = useStudentCourses(user.id);
  const updateGoal = useUpdateGoal(user.id);

  const [target, setTarget] = useState<number | null>(null);
  const [hyp, setHyp] = useState<Record<string, number>>({});
  useEffect(() => { if (goal?.target_average && target == null) setTarget(goal.target_average); }, [goal, target]);

  const effectiveTarget = target ?? 27;
  const sim = useMemo(() => (records ? simulateGrades(records, hyp, effectiveTarget) : null), [records, hyp, effectiveTarget]);
  const readinessByCourseId = new Map(courses?.map((c) => [c.course.id, c.readiness.readiness]));

  const debounced = useDebounced({ sim, effectiveTarget });
  const comment = useQuery({
    queryKey: ['ai-grades', debounced.effectiveTarget, debounced.sim?.requiredAverage, debounced.sim?.projectedAverage],
    enabled: !!debounced.sim && !!courses,
    queryFn: () => ai.gradesComment({ sim: debounced.sim!, target: debounced.effectiveTarget, readinessByCourse: courses!.map((c) => ({ name: c.course.name, readiness: c.readiness.readiness })) }),
  });

  if (isLoading || !records || !sim) return <LoadingBlock rows={4} />;
  const passed = records.filter((r) => r.passed_at).sort((a, b) => (b.passed_at ?? '').localeCompare(a.passed_at ?? ''));
  const pending = records.filter((r) => !r.passed_at);
  const avg = weightedAverage(records);

  return (
    <>
      <PageHeader title="Libretto" description="La tua carriera con la media che si aggiorna in tempo reale: imposta un obiettivo e simula i voti degli esami mancanti." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Media ponderata (CFU)" value={fmt(avg, 2)} />
        <StatCard label="Media aritmetica" value={fmt(arithmeticAverage(records), 2)} />
        <StatCard label="Voto di laurea di partenza" value={`${fmt(graduationBase(avg), 1)}/110`} hint="media ponderata × 110 / 30" />
        <StatCard label="CFU acquisiti" value={earnedCfu(records)} hint={`${sim.remainingCfu} CFU da sostenere`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Simulatore */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Simulatore</CardTitle>
            <CardDescription>Imposta l'obiettivo e muovi i voti ipotetici degli esami mancanti</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Media obiettivo</span>
                <span className="text-2xl font-semibold tabular-nums">{fmt(effectiveTarget, 1)}</span>
              </div>
              <Slider min={18} max={30} step={0.1} value={[effectiveTarget]} onValueChange={([v]) => setTarget(v)} onValueCommit={([v]) => updateGoal.mutate({ target_average: v })} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>18</span><span>≈ {fmt(graduationBase(effectiveTarget), 0)}/110 di partenza</span><span>30</span></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Esami da sostenere</span>
                {Object.keys(hyp).length > 0 && <Button size="sm" variant="ghost" onClick={() => setHyp({})}><RotateCcw /> Azzera</Button>}
              </div>
              {pending.map((r) => {
                const readiness = r.course_id ? readinessByCourseId.get(r.course_id) : undefined;
                const v = hyp[r.id];
                return (
                  <div key={r.id} className="rounded-md border p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{r.course_name}</span>
                      <span className="text-xs text-muted-foreground">{r.cfu} CFU</span>
                      {readiness != null && (
                        <Link to={`/student/exams/${r.course_id}`}>
                          <Badge variant={readinessBand(readiness)}>readiness {Math.round(readiness)}%</Badge>
                        </Link>
                      )}
                      <span className={cn('ml-auto text-lg font-semibold tabular-nums', v == null && 'text-muted-foreground')}>{v ?? '—'}</span>
                    </div>
                    <Slider min={18} max={30} step={1} value={[v ?? 18]} onValueChange={([x]) => setHyp((h) => ({ ...h, [r.id]: x }))} className={cn(v == null && 'opacity-50')} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risultato */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Risultato della simulazione</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Media proiettata</div>
                  <div className="text-xl font-semibold tabular-nums">{fmt(sim.projectedAverage, 2)}</div>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Laurea di partenza</div>
                  <div className="text-xl font-semibold tabular-nums">{fmt(sim.projectedGraduationBase, 1)}</div>
                </div>
              </div>
              <div className={cn('rounded-md border p-4', sim.feasible ? 'border-band-mastered/40 bg-band-mastered/5' : 'border-band-gap/40 bg-band-gap/5')}>
                <div className="text-sm text-muted-foreground">Voto medio necessario sugli esami mancanti</div>
                <div className={cn('text-3xl font-semibold tabular-nums', sim.feasible ? 'text-band-mastered' : 'text-band-gap')}>
                  {sim.requiredAverage == null ? '—' : fmt(sim.requiredAverage, 2)}
                </div>
                <div className="text-xs text-muted-foreground">{sim.feasible ? 'Obiettivo raggiungibile' : 'Obiettivo non raggiungibile con i CFU rimasti'}</div>
              </div>
              <div className="flex gap-3 rounded-md bg-accent/60 p-4 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {comment.data && !comment.isFetching ? <RichText text={comment.data} /> : <Skeleton className="h-16 w-full" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Esami sostenuti</CardTitle><CardDescription>Dati ufficiali da ESSE3</CardDescription></CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {passed.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2">
                    {r.grade ? <CheckCircle2 className="h-4 w-4 text-band-mastered" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{r.course_name}</div>
                      <div className="text-xs text-muted-foreground">{r.cfu} CFU · {fmtDate(r.passed_at!, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <span className="font-semibold tabular-nums">{r.grade ? `${r.grade}${r.honors ? 'L' : ''}` : 'Idoneo'}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
