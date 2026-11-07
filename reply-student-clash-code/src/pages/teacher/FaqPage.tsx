import { useState } from 'react';
import { CheckCircle2, ChevronDown, MessageCircleQuestion, Send } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useCurrentUser } from '@/app/AuthContext';
import { useQuestionClusters, useSetOfficialAnswer, useStudentQuestions, useTeacherCourses } from '@/data/hooks';
import { CourseTabs, useSelectedCourse } from '@/components/CourseSelect';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const WEEKS = ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09'];

export function FaqPage() {
  const user = useCurrentUser();
  const { data: courses } = useTeacherCourses(user.id);
  const { courseId, select } = useSelectedCourse(courses);
  const { data: clusters, isLoading } = useQuestionClusters(courseId);
  const { data: questions } = useStudentQuestions(courseId);
  const answer = useSetOfficialAnswer(courseId ?? '', user.id);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const rows = (clusters ?? []).map((c) => {
    const qs = (questions ?? []).filter((q) => q.cluster_id === c.id);
    const trend = WEEKS.slice(0, -1).map((w, i) => ({ w: new Date(w).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), n: qs.filter((q) => q.asked_at >= w && q.asked_at < WEEKS[i + 1]).length }));
    return { c, qs, trend, recent: trend.slice(-2).reduce((s, t) => s + t.n, 0) };
  }).sort((a, b) => b.qs.length - a.qs.length);

  return (
    <>
      <PageHeader title="Domande frequenti" description="Le domande degli studenti al tutor, anonimizzate e raggruppate per significato. Rispondi una volta: la risposta ufficiale migliora il tutor per tutti." actions={courses && <CourseTabs courses={courses} value={courseId} onChange={select} />} />
      {isLoading ? <LoadingBlock /> : rows.length === 0 ? <EmptyState icon={MessageCircleQuestion} title="Nessuna domanda per questo corso" /> : (
        <div className="space-y-3">
          {rows.map(({ c, qs, trend, recent }) => (
            <Card key={c.id}>
              <CardContent className="p-0">
                <button className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.title}</span>
                      {c.official_answer ? <Badge variant="mastered"><CheckCircle2 className="h-3 w-3" /> Risposta ufficiale</Badge> : <Badge variant="consolidating">Da rispondere</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trend}><XAxis dataKey="w" hide /><Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: number) => [v, 'domande']} /><Bar dataKey="n" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} /></BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-20 text-right"><div className="text-xl font-semibold tabular-nums">{qs.length}</div><div className="text-xs text-muted-foreground">{recent} recenti</div></div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open === c.id && 'rotate-180')} />
                  </div>
                </button>
                {open === c.id && (
                  <div className="grid gap-5 border-t p-5 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Domande (anonime)</div>
                      <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">{qs.map((q) => <li key={q.id} className="rounded bg-muted/60 px-3 py-1.5">“{q.text}”</li>)}</ul>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Risposta ufficiale</div>
                      {c.official_answer && <p className="mb-3 rounded-md border border-band-mastered/40 bg-band-mastered/5 p-3 text-sm">{c.official_answer}</p>}
                      <Textarea rows={4} placeholder="Scrivi una risposta che il tutor userà come fonte prioritaria…" value={draft[c.id] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))} />
                      <Button className="mt-2" size="sm" disabled={!draft[c.id]?.trim() || answer.isPending} onClick={() => answer.mutate({ clusterId: c.id, answer: draft[c.id] }, { onSuccess: () => setDraft((d) => ({ ...d, [c.id]: '' })) })}>
                        <Send /> {c.official_answer ? 'Aggiorna risposta' : 'Pubblica risposta'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
