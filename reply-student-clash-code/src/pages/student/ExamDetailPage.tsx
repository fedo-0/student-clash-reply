import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bot, BookOpenCheck, CalendarDays, Sparkles } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCurrentUser } from '@/app/AuthContext';
import { useExamDetail } from '@/data/hooks';
import { ai } from '@/ai/client';
import { PageHeader, LoadingBlock, RichText } from '@/components/common';
import { BandBadge, BandLegend, MasteryBar, ReadinessRing, TrendBadge } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { trendOf } from '@/lib/readiness';
import { daysUntil, fmtCountdown, fmtDate } from '@/lib/dates';
import type { AffinityItemKind } from '@/lib/affinity';
import { cn } from '@/lib/utils';

const KIND_ICON: Record<AffinityItemKind, string> = { pro: '✅', warn: '⚠️', con: '❌' };

export function ExamDetailPage() {
  const { courseId } = useParams();
  const user = useCurrentUser();
  const { data, isLoading } = useExamDetail(user.id, courseId);
  const days = daysUntil(data?.nextSession?.date);

  const advice = useQuery({
    queryKey: ['ai-exam-advice', courseId, data?.readiness.readiness],
    enabled: !!data,
    queryFn: () => ai.examAdvice({ courseName: data!.course.name, readiness: data!.readiness, daysToExam: days }),
  });

  if (isLoading || !data) return <LoadingBlock rows={4} />;
  const { course, readiness, affinity, trend } = data;
  const tutorLink = (topicId: string) => `/student/tutor?course=${course.id}&topic=${topicId}&mode=guided_gap`;
  const quizLink = (topicId: string) => `/student/quiz?course=${course.id}&topic=${topicId}`;

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link to="/student"><ArrowLeft /> Home</Link></Button>
      <PageHeader
        title={course.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{course.cfu} CFU</span>
            {data.nextSession && <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Scritto {fmtDate(data.nextSession.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtCountdown(days)}</span>}
          </span>
        }
        actions={<Button asChild><Link to={`/student/tutor?course=${course.id}`}><Bot /> Chiedi al tutor</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Readiness d'esame</CardTitle>
              <CardDescription>Media dei tuoi livelli per argomento, pesata per quanto ognuno conta all'esame</CardDescription>
            </div>
            <TrendBadge delta={trendOf(trend, 2)} period="in 2 settimane" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <ReadinessRing value={readiness.readiness} size={132} stroke={12} />
              <div className="h-40 min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number) => [`${Math.round(v)}%`, 'Readiness']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-5 flex gap-3 rounded-md bg-accent/60 p-4 text-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {advice.data ? <RichText text={advice.data} /> : <Skeleton className="h-10 w-full" />}
            </div>
          </CardContent>
        </Card>

        {/* Affinità */}
        <Card>
          <CardHeader>
            <CardTitle>Affinità con l'esame</CardTitle>
            <CardDescription>Quanto il tuo profilo è compatibile con questo esame</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tabular-nums">{affinity.score}</span>
              <span className="mb-1.5 text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              {([
                ['Readiness', affinity.components.readiness, affinity.weights.readiness],
                ['Esami propedeutici', affinity.components.prerequisites, affinity.weights.prerequisites],
                ['Skill del profilo', affinity.components.skills, affinity.weights.skills],
              ] as const).map(([label, v, w]) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs"><span>{label} <span className="text-muted-foreground">· peso {Math.round(w * 100)}%</span></span><span className="tabular-nums">{Math.round(v)}</span></div>
                  <Progress value={v} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spiegazione affinità */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Perché questo punteggio</CardTitle>
            <CardDescription>Punti a favore, argomenti da praticare e lacune da colmare</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {affinity.items.map((it, i) => (
                <li key={i} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <span className="flex flex-1 gap-3 text-sm"><span>{KIND_ICON[it.kind]}</span><span>{it.text}</span></span>
                  {it.topicId && it.kind !== 'pro' && (
                    <span className="flex shrink-0 gap-2 pl-7 sm:pl-0">
                      <Button size="sm" variant={it.kind === 'con' ? 'default' : 'outline'} asChild><Link to={tutorLink(it.topicId)}><Bot /> Colma con il tutor</Link></Button>
                      <Button size="sm" variant="outline" asChild><Link to={quizLink(it.topicId)}><BookOpenCheck /> Fai un quiz</Link></Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Dettaglio topic */}
        <Card className="lg:col-span-3">
          <CardHeader className="gap-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Livello per argomento</CardTitle>
              <CardDescription>Peso nell'esame, livello attuale e affidabilità della stima</CardDescription>
            </div>
            <BandLegend />
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {readiness.items.map((it) => (
                <div key={it.topic.id} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex-1 truncate text-sm font-medium">{it.topic.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(it.weight * 100)}% esame</span>
                    <BandBadge band={it.band} />
                  </div>
                  <MasteryBar score={it.score} band={it.band} />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">{it.practiced ? `${Math.round(it.score)}/100 · affidabilità ${Math.round(it.confidence * 100)}%` : 'Non ancora praticato'}</span>
                    <span className={cn('flex gap-1', it.band === 'mastered' && 'invisible')}>
                      <Link to={tutorLink(it.topic.id)} className="text-primary hover:underline">Tutor</Link> ·
                      <Link to={quizLink(it.topic.id)} className="text-primary hover:underline">Quiz</Link>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
