import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileText, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCurrentUser } from '@/app/AuthContext';
import { useClassVectors, useExamDrafts, useTeacherCourses, useTopics } from '@/data/hooks';
import { ai } from '@/ai/client';
import { CourseTabs, useSelectedCourse } from '@/components/CourseSelect';
import { PageHeader, StatCard, LoadingBlock, EmptyState, RichText } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { predictExam } from '@/lib/prediction';
import { fmt, cn } from '@/lib/utils';

export function PredictionPage() {
  const user = useCurrentUser();
  const { data: courses } = useTeacherCourses(user.id);
  const { courseId, select } = useSelectedCourse(courses);
  const { data: drafts } = useExamDrafts(courseId);
  const { data: vectors } = useClassVectors(courseId);
  const { data: topics } = useTopics(courseId);
  const draft = drafts?.[0];
  const [weights, setWeights] = useState<Record<string, number>>({});

  // I numeri li calcola il codice (Monte Carlo deterministico, seed fisso)
  const result = useMemo(
    () => (draft && vectors ? predictExam({ exercises: draft.exercises, students: vectors, maxPoints: 30, passThreshold: 18, iterations: 2000, pointOverrides: weights }) : null),
    [draft, vectors, weights],
  );
  const topicNames = Object.fromEntries((topics ?? []).map((t) => [t.id, t.name]));
  const explanation = useQuery({
    queryKey: ['ai-pred', draft?.id, result?.expectedMean, result?.passRate],
    enabled: !!result && !!draft,
    queryFn: () => ai.explainPrediction({ result: result!, examTitle: draft!.title, topicNames, exerciseTopics: Object.fromEntries(draft!.exercises.map((e) => [e.id, e.topic_ids])) }),
  });

  return (
    <>
      <PageHeader title="Stima predittiva dei voti" description="Carica la bozza d'esame: stimiamo media, promossi ed esercizi critici sulla base della preparazione attuale della classe." actions={courses && <CourseTabs courses={courses} value={courseId} onChange={(id) => { select(id); setWeights({}); }} />} />
      {!drafts ? <LoadingBlock rows={3} /> : !draft ? (
        <EmptyState icon={Upload} title="Nessuna bozza caricata" description="Carica il PDF della bozza: l'AI la scompone in esercizi (punti, topic, difficoltà)." action={<Button disabled><Upload /> Carica bozza</Button>} />
      ) : !result ? <LoadingBlock rows={3} /> : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> {draft.title} · {draft.exercises.length} esercizi · {result.studentsCount} studenti · 2.000 simulazioni Monte Carlo</div>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Media attesa" value={fmt(result.expectedMean, 1)} hint={`intervallo 90%: ${fmt(result.ciLow, 1)} – ${fmt(result.ciHigh, 1)}`} />
            <StatCard label="Promossi attesi" value={`${Math.round(result.passRate * 100)}%`} tone={result.passRate < 0.5 ? 'bad' : 'good'} />
            <StatCard label="Esercizi critici" value={result.perExercise.filter((e) => e.critical).length} hint="successo atteso < 50%" tone={result.perExercise.some((e) => e.critical) ? 'bad' : 'default'} />
            <StatCard label="Punti totali" value={fmt(result.perExercise.reduce((s, e) => s + e.points, 0), 0)} hint="scalati a 30" />
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div><CardTitle>Esercizi · modalità what-if</CardTitle><CardDescription>Modifica il peso di un esercizio e guarda come cambia la previsione</CardDescription></div>
                {Object.keys(weights).length > 0 && <Button size="sm" variant="ghost" onClick={() => setWeights({})}><RotateCcw /> Ripristina</Button>}
              </CardHeader>
              <CardContent className="space-y-4">
                {draft.exercises.map((e) => {
                  const pe = result.perExercise.find((p) => p.exerciseId === e.id)!;
                  return (
                    <div key={e.id} className={cn('rounded-md border p-3', pe.critical && 'border-band-gap/50 bg-band-gap/5')}>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{e.title}</span>
                        {pe.critical && <Badge variant="gap"><AlertTriangle className="h-3 w-3" /> critico</Badge>}
                        <span className="ml-auto tabular-nums text-muted-foreground">{fmt(pe.points, 1)} pt · successo {Math.round(pe.successRate * 100)}%</span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1">{e.topic_ids.map((t) => <Badge key={t} variant="outline" className="font-normal">{topicNames[t]}</Badge>)}<Badge variant="secondary" className="font-normal">difficoltà {Math.round(e.difficulty * 100)}%</Badge></div>
                      <Slider min={0} max={2} step={0.1} value={[weights[e.id] ?? 1]} onValueChange={([v]) => setWeights((w) => ({ ...w, [e.id]: v }))} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Distribuzione attesa dei voti</CardTitle></CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.histogram} margin={{ left: -25, right: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [fmt(v, 1), 'Studenti (media)']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {result.histogram.map((h) => <Cell key={h.bucket} fill={h.bucket === '<18' ? 'hsl(var(--band-gap))' : 'hsl(var(--primary))'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-primary/30">
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Spiegazione AI</CardTitle><CardDescription>L'AI commenta i numeri, non li calcola</CardDescription></CardHeader>
                <CardContent className="text-sm">{explanation.data && !explanation.isFetching ? <RichText text={explanation.data} /> : <Skeleton className="h-24" />}</CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
