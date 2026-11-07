import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, XCircle, ArrowRight, Play } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useQuizQuestions, useQuizzes, useRecordLearningEvent, useStudentCourses } from '@/data/hooks';
import type { QuizQuestion } from '@/types/database';
import { PageHeader, EmptyState, PrototypeNote } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function isCorrect(q: QuizQuestion, answer: string) {
  if (q.type === 'true_false') return String(q.correct_answer) === answer;
  if (Array.isArray(q.correct_answer)) return q.correct_answer.includes(answer);
  return false;
}

function Player({ quizId, onExit }: { quizId: string; onExit: () => void }) {
  const user = useCurrentUser();
  const { data: questions } = useQuizQuestions(quizId);
  const record = useRecordLearningEvent();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const closed = questions?.filter((q) => q.type !== 'open') ?? [];
  if (!questions) return null;
  if (idx >= closed.length)
    return (
      <Card><CardContent className="p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-band-mastered" />
        <div className="text-xl font-semibold">{score}/{closed.length} risposte corrette</div>
        <p className="mt-1 text-sm text-muted-foreground">Il tuo livello sugli argomenti del quiz è stato aggiornato: lo vedi già nella readiness dell'esame e nella mappa del docente.</p>
        <Button className="mt-5" onClick={onExit}>Torna ai quiz</Button>
      </CardContent></Card>
    );
  const q = closed[idx];
  const options = q.type === 'true_false' ? [{ id: 'true', text: 'Vero' }, { id: 'false', text: 'Falso' }] : q.options ?? [];
  const submit = (a: string) => {
    setAnswer(a);
    const ok = isCorrect(q, a);
    if (ok) setScore((s) => s + 1);
    for (const t of q.topic_ids) record.mutate({ student_id: user.id, topic_id: t, score: ok ? 100 : 0, difficulty: q.difficulty_estimated ?? 0.5, weight: 1, source: 'quiz' });
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Domanda {idx + 1} di {closed.length}</span><Button variant="ghost" size="sm" onClick={onExit}>Esci</Button></div>
        <Progress value={(idx / closed.length) * 100} />
        <CardTitle className="pt-3 text-lg">{q.prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((o) => {
          const chosen = answer === o.id;
          const right = answer && isCorrect(q, o.id);
          return (
            <button key={o.id} disabled={!!answer} onClick={() => submit(o.id)}
              className={cn('flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors', !answer && 'hover:border-primary', right && 'border-band-mastered bg-band-mastered/10', chosen && !right && 'border-band-gap bg-band-gap/10')}>
              {right ? <CheckCircle2 className="h-4 w-4 text-band-mastered" /> : chosen ? <XCircle className="h-4 w-4 text-band-gap" /> : <span className="h-4 w-4 rounded-full border" />}
              {o.text}
            </button>
          );
        })}
        {answer && (
          <div className="mt-3 flex flex-col gap-3 rounded-md bg-muted p-3 text-sm sm:flex-row sm:items-center">
            <span className="flex-1">{q.explanation}</span>
            <Button size="sm" onClick={() => { setIdx(idx + 1); setAnswer(null); }}>Avanti <ArrowRight /></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuizPage() {
  const user = useCurrentUser();
  const [params] = useSearchParams();
  const { data: courses } = useStudentCourses(user.id);
  const [courseId, setCourseId] = useState<string | undefined>(params.get('course') ?? undefined);
  const cid = courseId ?? courses?.[0]?.course.id;
  const { data: quizzes } = useQuizzes(cid);
  const [playing, setPlaying] = useState<string | null>(null);
  const topicFilter = params.get('topic');
  const published = quizzes?.filter((q) => q.status === 'published') ?? [];

  return (
    <>
      <PageHeader title="Quiz" description="Quiz pubblicati dai docenti e quiz adattivi: ogni risposta aggiorna il tuo livello in tempo reale." />
      <PrototypeNote>Prototipo: player base funzionante (aggiorna davvero il mastery). Quiz adattivi generati dall'AI su un singolo argomento in arrivo.</PrototypeNote>
      {playing ? <Player quizId={playing} onExit={() => setPlaying(null)} /> : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {courses?.map((c) => <Button key={c.course.id} size="sm" variant={c.course.id === cid ? 'default' : 'outline'} onClick={() => setCourseId(c.course.id)}>{c.course.name}</Button>)}
          </div>
          {published.length === 0 ? <EmptyState icon={BookOpenCheck} title="Nessun quiz pubblicato" description="Quando il docente pubblica un quiz lo trovi qui." /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {published.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle>{q.title}</CardTitle>
                    <CardDescription>Pubblicato dal docente{topicFilter ? ' · consigliato per la tua lacuna' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant="secondary">~5 min</Badge>
                    <Button onClick={() => setPlaying(q.id)}><Play /> Inizia</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
