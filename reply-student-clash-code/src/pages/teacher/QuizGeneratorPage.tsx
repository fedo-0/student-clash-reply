import { useState } from 'react';
import { Check, FileText, Loader2, RefreshCw, Send, Sparkles, Trash2, Upload } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useDocuments, useTeacherCourses, useTopics } from '@/data/hooks';
import { ai, type GeneratedQuestion } from '@/ai/client';
import type { QuestionType, Topic } from '@/types/database';
import { CourseTabs, useSelectedCourse } from '@/components/CourseSelect';
import { PageHeader, PrototypeNote } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const TYPES: { id: QuestionType; label: string }[] = [
  { id: 'single_choice', label: 'Scelta singola' },
  { id: 'true_false', label: 'Vero/Falso' },
  { id: 'open', label: 'Aperta' },
];
type Status = 'pending' | 'approved' | 'rejected';

export function QuizGeneratorPage() {
  const user = useCurrentUser();
  const { data: courses } = useTeacherCourses(user.id);
  const { courseId, select } = useSelectedCourse(courses);
  const { data: docs } = useDocuments(courseId);
  const { data: topics } = useTopics(courseId);

  const [doc, setDoc] = useState<string | null>(null);
  const [proposed, setProposed] = useState<{ topic: Topic; coverage: number }[] | null>(null);
  const [selTopics, setSelTopics] = useState<string[]>([]);
  const [types, setTypes] = useState<QuestionType[]>(['single_choice', 'true_false']);
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState(0.5);
  const [busy, setBusy] = useState<string | null>(null);
  const [questions, setQuestions] = useState<(GeneratedQuestion & { status: Status })[]>([]);
  const [published, setPublished] = useState(false);

  const docTitle = docs?.find((d) => d.id === doc)?.title ?? '';
  const analyze = async (id: string) => {
    setDoc(id); setBusy('analyze'); setQuestions([]); setPublished(false);
    const p = await ai.proposeTopicsFromPdf(id, topics ?? []);
    setProposed(p); setSelTopics(p.filter((x) => x.coverage > 0.5).map((x) => x.topic.id)); setBusy(null);
  };
  const generate = async () => {
    setBusy('generate');
    const qs = await ai.generateQuiz({ topics: (topics ?? []).filter((t) => selTopics.includes(t.id)), count, types, difficulty, documentTitle: docTitle });
    setQuestions(qs.map((q) => ({ ...q, status: 'pending' }))); setBusy(null);
  };
  const regenerate = async (i: number) => {
    const t = (topics ?? []).filter((x) => x.name === questions[i].topic);
    const [q] = await ai.generateQuiz({ topics: t, count: 1, types: [questions[i].type], difficulty, documentTitle: docTitle });
    setQuestions((qs) => qs.map((x, k) => (k === i ? { ...q, status: 'pending' } : x)));
  };
  const setStatus = (i: number, s: Status) => setQuestions((qs) => qs.map((x, k) => (k === i ? { ...x, status: s } : x)));
  const approved = questions.filter((q) => q.status === 'approved').length;

  return (
    <>
      <PageHeader title="Generatore quiz" description="Dai tuoi PDF a un quiz pronto da pubblicare: l'AI propone, tu rivedi e approvi." actions={courses && <CourseTabs courses={courses} value={courseId} onChange={(id) => { select(id); setDoc(null); setProposed(null); setQuestions([]); }} />} />
      <PrototypeNote>Prototipo: upload e generazione sono simulati; la pubblicazione non scrive ancora sul data layer.</PrototypeNote>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>1 · Materiale</CardTitle><CardDescription>Scegli un documento del corso o caricane uno</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {docs?.map((d) => (
                <button key={d.id} onClick={() => analyze(d.id)} className={cn('flex w-full items-center gap-2 rounded-md border p-2.5 text-left text-sm', doc === d.id ? 'border-primary bg-accent' : 'hover:bg-muted')}>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="flex-1">{d.title}</span><span className="text-xs text-muted-foreground">{d.pages} pp.</span>
                </button>
              ))}
              <Button variant="outline" className="w-full" disabled><Upload /> Carica PDF</Button>
            </CardContent>
          </Card>
          {busy === 'analyze' && <Card><CardContent className="flex items-center gap-2 p-5 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Analisi del documento…</CardContent></Card>}
          {proposed && (
            <Card>
              <CardHeader><CardTitle>2 · Parametri</CardTitle><CardDescription>Topic individuati nel documento</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {proposed.map((p) => {
                    const on = selTopics.includes(p.topic.id);
                    return <button key={p.topic.id} onClick={() => setSelTopics((s) => (on ? s.filter((x) => x !== p.topic.id) : [...s, p.topic.id]))}><Badge variant={on ? 'default' : 'outline'}>{p.topic.name} · {Math.round(p.coverage * 100)}%</Badge></button>;
                  })}
                </div>
                <div><div className="mb-2 flex justify-between text-sm"><span>Numero domande</span><span className="font-medium">{count}</span></div><Slider min={3} max={15} step={1} value={[count]} onValueChange={([v]) => setCount(v)} /></div>
                <div><div className="mb-2 flex justify-between text-sm"><span>Difficoltà</span><span className="font-medium">{difficulty < 0.4 ? 'Facile' : difficulty < 0.65 ? 'Media' : 'Difficile'}</span></div><Slider min={0.2} max={0.9} step={0.05} value={[difficulty]} onValueChange={([v]) => setDifficulty(v)} /></div>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => { const on = types.includes(t.id); return <button key={t.id} onClick={() => setTypes((s) => (on ? s.filter((x) => x !== t.id) : [...s, t.id]))}><Badge variant={on ? 'secondary' : 'outline'}>{on && <Check className="h-3 w-3" />}{t.label}</Badge></button>; })}
                </div>
                <Button className="w-full" onClick={generate} disabled={!selTopics.length || !types.length || busy === 'generate'}>{busy === 'generate' ? <Loader2 className="animate-spin" /> : <Sparkles />} Genera domande</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          {questions.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center p-12 text-center text-sm text-muted-foreground"><Sparkles className="mb-3 h-8 w-8 text-primary" />Seleziona un documento e genera le domande: compariranno qui per la revisione.</CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">3 · Revisione <span className="font-normal text-muted-foreground">({approved}/{questions.length} approvate)</span></h2>
                <Button disabled={!approved || published} onClick={() => setPublished(true)}><Send /> {published ? 'Pubblicato agli studenti' : 'Pubblica'}</Button>
              </div>
              {questions.map((q, i) => (
                <Card key={q.id} className={cn(q.status === 'approved' && 'border-band-mastered/50', q.status === 'rejected' && 'opacity-50')}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="secondary">{TYPES.find((t) => t.id === q.type)?.label}</Badge>
                      <Badge variant="outline">{q.topic}</Badge>
                      <span className="text-muted-foreground">difficoltà {Math.round(q.difficulty * 100)}%</span>
                      <span className="ml-auto flex items-center gap-1 text-muted-foreground"><FileText className="h-3 w-3" /> {q.source.title}, p. {q.source.page}</span>
                    </div>
                    <div className="font-medium">{i + 1}. {q.prompt}</div>
                    {q.options && (
                      <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
                        {q.options.map((o) => <li key={o.id} className={cn('rounded border px-2.5 py-1.5', o.id === q.correct && 'border-band-mastered bg-band-mastered/10')}>{o.id}) {o.text}</li>)}
                      </ul>
                    )}
                    {!q.options && <div className="text-sm"><span className="text-muted-foreground">Risposta attesa:</span> {q.correct}</div>}
                    <div className="text-xs text-muted-foreground">💡 {q.explanation}</div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={q.status === 'approved' ? 'default' : 'outline'} onClick={() => setStatus(i, 'approved')}><Check /> Approva</Button>
                      <Button size="sm" variant="outline" onClick={() => regenerate(i)}><RefreshCw /> Rigenera</Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(i, 'rejected')}><Trash2 /> Scarta</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
