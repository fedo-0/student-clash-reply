import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, Bot, Briefcase, CalendarDays, CheckCircle2, ClipboardCheck, Eye, EyeOff, Lightbulb, Lock, MessageSquare,
  RotateCcw, Send, Settings2, Sparkles, Target, Theater, TrendingUp, UserRound, XCircle,
} from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useRecordLearningEvent, useRoleplayScenarios, useStudentCourses, useTopics } from '@/data/hooks';
import { ai, type ChatTurn, type RoleplayReport } from '@/ai/client';
import type { RoleplayAttitude, RoleplayDifficulty, RoleplayScenario } from '@/types/database';
import type { StudentCourseSummary } from '@/types/domain';
import {
  ATTITUDE_INFO, DIFFICULTY_INFO, EVENT_DIFFICULTY, availableFacts, recommendedDifficulty, scoreRoleplay, type RoleplayScore,
} from '@/lib/roleplay';
import { bandOfMastery } from '@/lib/mastery';
import { daysUntil, fmtCountdown } from '@/lib/dates';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/common';
import { BandBadge, MasteryBar, ReadinessRing, TrendBadge } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Config {
  scenario: RoleplayScenario;
  difficulty: RoleplayDifficulty;
  attitude: RoleplayAttitude;
  /** materia dello studente: null = anteprima di un corso a cui non è iscritto (nessun aggiornamento del mastery) */
  summary: StudentCourseSummary | null;
}

const ATTITUDE_BADGE: Record<RoleplayAttitude, 'mastered' | 'consolidating' | 'gap'> = { gentle: 'mastered', moderate: 'consolidating', aggressive: 'gap' };

// ---- Descrizione dell'attività -------------------------------------------------
function ActivityIntro() {
  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-accent/70 to-card">
      <CardContent className="grid gap-6 p-6 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold"><Theater className="h-4 w-4 text-primary" /> Cosa mostra</div>
          <p className="text-sm text-muted-foreground">
            Un caso reale costruito sugli <strong className="text-foreground">argomenti della materia che stai preparando</strong>. L'AI interpreta un cliente
            o un paziente con alcune informazioni nascoste: per farle emergere devi riconoscere i concetti del corso nel problema e fare le domande giuste.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold"><Briefcase className="h-4 w-4 text-primary" /> A cosa ti prepara</div>
          <p className="text-sm text-muted-foreground">
            All'esame, perché ti costringe ad <strong className="text-foreground">applicare la teoria a un caso concreto</strong> (come negli esercizi e all'orale),
            e al lavoro: primo incontro con un cliente, tirocini, colloqui con casi pratici. Alleni anche ascolto e gestione di persone difficili.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Come funziona</div>
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li><span className="font-medium text-foreground">1.</span> Scegli la materia: il caso usa i suoi argomenti.</li>
            <li><span className="font-medium text-foreground">2.</span> Scegli difficoltà e atteggiamento dell'interlocutore.</li>
            <li><span className="font-medium text-foreground">3.</span> Il risultato per argomento <strong className="text-foreground">aggiorna il tuo livello</strong> e la readiness dell'esame.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

function OptionCard({ active, onClick, title, description, extra }: { active: boolean; onClick: () => void; title: string; description: string; extra?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-lg border p-3 text-left transition-all', active ? 'border-primary bg-accent ring-1 ring-primary' : 'hover:border-primary/50 hover:bg-muted/50')}>
      <div className="flex items-center justify-between gap-2 text-sm font-medium">{title}{extra}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </button>
  );
}

// ---- Setup -------------------------------------------------------------------
function Setup({ scenarios, courses, topicNames, initial, onStart }: {
  scenarios: RoleplayScenario[];
  courses: StudentCourseSummary[];
  topicNames: (courseId: string) => Record<string, string>;
  initial?: Config;
  onStart: (c: Config) => void;
}) {
  const [params, setParams] = useSearchParams();
  const myCourses = courses.filter((c) => scenarios.some((s) => s.course_id === c.course.id));
  const previews = scenarios.filter((s) => !courses.some((c) => c.course.id === s.course_id));
  const scenarioId = params.get('scenario');
  const courseId = params.get('course') ?? initial?.scenario.course_id ?? myCourses[0]?.course.id;
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios.find((s) => s.course_id === courseId) ?? scenarios[0];
  const summary = courses.find((c) => c.course.id === scenario.course_id) ?? null;
  const recommended = summary ? recommendedDifficulty(summary.readiness.readiness) : 1;

  const [difficulty, setDifficulty] = useState<RoleplayDifficulty>(initial?.difficulty ?? recommended);
  const [attitude, setAttitude] = useState<RoleplayAttitude>(initial?.attitude ?? 'moderate');
  useEffect(() => { if (!initial) setDifficulty(recommended); }, [scenario.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (patch: { course?: string; scenario?: string }) => setParams((p) => {
    p.delete('course'); p.delete('scenario');
    if (patch.course) p.set('course', patch.course);
    if (patch.scenario) p.set('scenario', patch.scenario);
    return p;
  }, { replace: true });

  const names = topicNames(scenario.course_id);
  const masteryByTopic = new Map(summary?.mastery.map((m) => [m.topic_id, m]));
  const factsPerTopic = (tid: string) => availableFacts(scenario, difficulty).filter((f) => f.topic_id === tid).length;

  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">Per quale materia ti stai preparando?</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {myCourses.map((c) => {
          const active = c.course.id === scenario.course_id;
          return (
            <button key={c.course.id} onClick={() => choose({ course: c.course.id })}
              className={cn('flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all', active ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50')}>
              <ReadinessRing value={c.readiness.readiness} size={56} stroke={6} label="" />
              <div className="min-w-0">
                <div className="font-medium">{c.course.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {c.nextSession ? `Esame ${fmtCountdown(daysUntil(c.nextSession.date))}` : 'Nessun appello'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {summary
                ? <Badge><Target className="h-3 w-3" /> Preparazione per {summary.course.name}</Badge>
                : <Badge variant="secondary">Anteprima · {scenario.degree_program}</Badge>}
              <Badge variant="outline">{scenario.counterpart_label}</Badge>
            </div>
            <CardTitle className="text-xl">{scenario.title}</CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex gap-3 rounded-md border p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent"><UserRound className="h-5 w-5 text-accent-foreground" /></div>
              <div className="text-sm">
                <div className="font-medium">{scenario.persona.name}{scenario.persona.age ? `, ${scenario.persona.age} anni` : ''}</div>
                <div className="text-muted-foreground">{scenario.persona.role}</div>
                <div className="mt-1">{scenario.persona.context}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Argomenti del corso che alleni{summary && ' · il tuo livello attuale'}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {scenario.topic_ids.map((tid) => {
                  const m = masteryByTopic.get(tid);
                  const n = factsPerTopic(tid);
                  return (
                    <div key={tid} className={cn('rounded-md border p-2.5', n === 0 && 'opacity-50')}>
                      <div className="mb-1.5 flex items-center gap-2 text-sm">
                        <span className="flex-1 font-medium">{names[tid]}</span>
                        {summary && <BandBadge band={bandOfMastery(m)} />}
                      </div>
                      {summary && <MasteryBar score={m?.score ?? 0} band={bandOfMastery(m)} />}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {n ? `${n} informazion${n === 1 ? 'e' : 'i'} nel caso` : 'non presente a questa difficoltà'}
                        {summary && ` · ${m ? Math.round(m.score) : 0}/100`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 rounded-md bg-muted/60 p-3 text-sm">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span><span className="font-medium">Ti prepara a: </span>{scenario.prepares_for}</span>
            </div>

            {previews.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-2 text-xs text-muted-foreground">Demo · anteprima dello scenario di altre materie (senza aggiornare il tuo livello):</div>
                <div className="flex flex-wrap gap-1.5">
                  {previews.map((s) => {
                    const c = s.id === scenario.id;
                    return <Button key={s.id} size="sm" variant={c ? 'default' : 'outline'} onClick={() => choose({ scenario: s.id })}>{s.title.split(':')[0]} · {s.degree_program}</Button>;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Imposta la simulazione</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium">Difficoltà della consulenza</div>
              <div className="grid gap-2">
                {([1, 2, 3] as RoleplayDifficulty[]).map((d) => (
                  <OptionCard key={d} active={difficulty === d} onClick={() => setDifficulty(d)} title={DIFFICULTY_INFO[d].label} description={DIFFICULTY_INFO[d].description}
                    extra={<span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                      {summary && d === recommended && <Badge variant="default" className="px-1.5 py-0 text-[10px]">Consigliata</Badge>}
                      {availableFacts(scenario, d).length} info
                    </span>} />
                ))}
              </div>
              {summary && <p className="mt-2 text-xs text-muted-foreground">Consigliata in base alla tua readiness su {summary.course.name} ({Math.round(summary.readiness.readiness)}%).</p>}
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Atteggiamento del {scenario.counterpart_label.toLowerCase()}</div>
              <div className="grid gap-2">
                {(['gentle', 'moderate', 'aggressive'] as RoleplayAttitude[]).map((a) => (
                  <OptionCard key={a} active={attitude === a} onClick={() => setAttitude(a)} title={ATTITUDE_INFO[a].label} description={ATTITUDE_INFO[a].description} />
                ))}
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => onStart({ scenario, difficulty, attitude, summary })}>
              Inizia la consulenza <ArrowRight />
            </Button>
            {summary && <p className="text-center text-xs text-muted-foreground">Al termine il risultato aggiorna il tuo livello sugli argomenti allenati.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ---- Sessione ----------------------------------------------------------------
function Session({ config, names, onFinish, onExit }: { config: Config; names: Record<string, string>; onFinish: (score: RoleplayScore) => void; onExit: () => void }) {
  const { scenario, difficulty, attitude } = config;
  const [turns, setTurns] = useState<ChatTurn[]>([{ role: 'assistant', content: scenario.persona.opening_lines[attitude] }]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [turns]);

  const facts = availableFacts(scenario, difficulty);
  const userTurns = turns.filter((t) => t.role === 'user').length;

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input;
    setInput('');
    setBusy(true);
    const history = turns;
    setTurns((t) => [...t, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);
    const newly: string[] = [];
    for await (const chunk of ai.roleplayReply({ scenario, difficulty, attitude, history, message: msg, revealed })) {
      if (chunk.type === 'fact') newly.push(chunk.id);
      else setTurns((t) => { const c = [...t]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + chunk.value }; return c; });
    }
    if (newly.length) setRevealed((r) => [...r, ...newly]);
    setBusy(false);
  };

  const finish = () => onFinish(scoreRoleplay({ scenario, difficulty, attitude, history: turns, revealedFactIds: revealed }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="flex h-[620px] flex-col lg:col-span-2">
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0 border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><UserRound className="h-5 w-5 text-accent-foreground" /></div>
          <div className="min-w-0 flex-1">
            <CardTitle>{scenario.persona.name}</CardTitle>
            <CardDescription>{scenario.persona.role}{config.summary && ` · preparazione per ${config.summary.course.name}`}</CardDescription>
          </div>
          <Badge variant="secondary">{DIFFICULTY_INFO[difficulty].label}</Badge>
          <Badge variant={ATTITUDE_BADGE[attitude]}>{ATTITUDE_INFO[attitude].label}</Badge>
          <Button size="sm" onClick={finish} disabled={busy || userTurns < 2}><ClipboardCheck /> Termina e valuta</Button>
        </CardHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {turns.map((t, i) => (
            <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{t.content || '…'}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Fai una domanda al ${scenario.counterpart_label.toLowerCase()}…`} autoFocus />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}><Send /></Button>
        </form>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Il caso</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{scenario.description}</p>
            <p className="text-muted-foreground">{scenario.persona.context}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">Informazioni emerse <span className="tabular-nums">{revealed.length}/{facts.length}</span></CardTitle>
            <Progress value={(revealed.length / Math.max(1, facts.length)) * 100} className="h-1.5" />
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {facts.map((f) => {
              const open = revealed.includes(f.id);
              return (
                <div key={f.id} className={cn('rounded px-2 py-1.5', open ? 'bg-band-mastered/10' : 'bg-muted/60 text-muted-foreground')}>
                  <div className="flex gap-2">
                    {open ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-band-mastered" /> : <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <span>{open ? f.fact : difficulty === 1 ? <><span className="font-medium">Suggerimento:</span> {f.hint.toLowerCase()}</> : 'Informazione nascosta'}</span>
                  </div>
                  <div className="mt-0.5 pl-5 text-[11px] uppercase tracking-wide opacity-70">{names[f.topic_id]}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowRubric(!showRubric)}>{showRubric ? <EyeOff /> : <Eye />} Come verrai valutato</Button>
            {showRubric && scenario.rubric.map((r) => <div key={r.criterion}><span className="font-medium">{r.criterion}</span> <span className="text-muted-foreground">({Math.round(r.weight * 100)}%) – {r.description}</span></div>)}
            <Button variant="link" size="sm" className="-ml-3 text-muted-foreground" onClick={onExit}>Abbandona la simulazione</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Impatto sul modello di competenze -----------------------------------------
function MasteryImpact({ config, score, names }: { config: Config; score: RoleplayScore; names: Record<string, string> }) {
  const user = useCurrentUser();
  const record = useRecordLearningEvent();
  const { data: courses } = useStudentCourses(user.id);
  const summary = config.summary!;
  // Fotografia "prima" presa al montaggio, prima di registrare gli eventi
  const [before] = useState(() => ({ readiness: summary.readiness.readiness, mastery: new Map(summary.mastery.map((m) => [m.topic_id, m.score])) }));
  const [after, setAfter] = useState<Map<string, number> | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      const res = new Map<string, number>();
      for (const t of score.topicScores) {
        const m = await record.mutateAsync({ student_id: user.id, topic_id: t.topicId, score: t.score, difficulty: EVENT_DIFFICULTY[config.difficulty], weight: 0.9, source: 'simulation' });
        res.set(t.topicId, m.score);
      }
      setAfter(res);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const readinessAfter = after ? courses?.find((c) => c.course.id === summary.course.id)?.readiness.readiness : undefined;
  // argomento da ripassare: il più debole tra quelli non esercitati, altrimenti il punteggio più basso
  const review = [...score.topicsNotExercised].sort((a, b) => (before.mastery.get(a) ?? 0) - (before.mastery.get(b) ?? 0))[0]
    ?? [...score.topicScores].sort((a, b) => a.score - b.score)[0]?.topicId;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Impatto sulla tua preparazione</CardTitle>
        <CardDescription>Il risultato per argomento è stato registrato come attività di tipo "simulazione" e aggiorna il tuo livello su {summary.course.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/60 p-3 text-sm">
          <span>Readiness {summary.course.name}</span>
          <span className="font-semibold tabular-nums">{Math.round(before.readiness)}%</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          {readinessAfter == null ? <Skeleton className="h-5 w-12" /> : <>
            <span className="font-semibold tabular-nums">{Math.round(readinessAfter)}%</span>
            <TrendBadge delta={readinessAfter - before.readiness} />
          </>}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {score.topicScores.map((t) => {
            const prev = before.mastery.get(t.topicId) ?? 0;
            const next = after?.get(t.topicId);
            return (
              <div key={t.topicId} className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{names[t.topicId]}</span>
                  <span className="text-xs text-muted-foreground">nel caso: {t.discovered}/{t.total} · {t.score}/100</span>
                </div>
                <MasteryBar score={next ?? prev} band={bandOfMastery({ score: next ?? prev, confidence: 1 })} />
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <span className="tabular-nums text-muted-foreground">{Math.round(prev)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  {next == null ? <Skeleton className="h-3 w-8" /> : <><span className="font-medium tabular-nums">{Math.round(next)}</span><TrendBadge delta={next - prev} /></>}
                </div>
              </div>
            );
          })}
        </div>
        {score.topicsNotExercised.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Non esercitati in questo caso (livello invariato): {score.topicsNotExercised.map((t) => names[t]).join(', ')}. Le domande giuste sono nel riepilogo qui sotto.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {review && <Button size="sm" asChild><Link to={`/student/tutor?course=${summary.course.id}&topic=${review}&mode=guided_gap`}><Bot /> Ripassa {names[review]} con il tutor</Link></Button>}
          <Button size="sm" variant="outline" asChild><Link to={`/student/exams/${summary.course.id}/preparazione`}>Vai alla readiness d'esame <ArrowRight /></Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Report ------------------------------------------------------------------
function Report({ config, score, names, onRetry, onSettings }: { config: Config; score: RoleplayScore; names: Record<string, string>; onRetry: () => void; onSettings: () => void }) {
  const { scenario, difficulty, attitude } = config;
  const [report, setReport] = useState<RoleplayReport | null>(null);
  useEffect(() => {
    let alive = true;
    ai.evaluateRoleplay({ scenario, difficulty, attitude, score, topicNames: names }).then((r) => { if (alive) setReport(r); });
    return () => { alive = false; };
  }, [scenario, difficulty, attitude, score, names]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Risultato</CardTitle>
          <CardDescription>{scenario.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-6xl font-semibold tabular-nums">{score.total}</span>
            <span className="mb-2 text-muted-foreground">/ 100</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{DIFFICULTY_INFO[difficulty].label}</Badge>
            <Badge variant={ATTITUDE_BADGE[attitude]}>{scenario.counterpart_label} {ATTITUDE_INFO[attitude].label.toLowerCase()}</Badge>
            {score.difficultyBonus > 0 && <Badge variant="outline">+{score.difficultyBonus} bonus difficoltà</Badge>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold tabular-nums">{score.stats.messages}</div>interventi</div>
            <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold tabular-nums">{score.stats.openQuestions}</div>domande aperte</div>
            <div className="rounded-md bg-muted p-2"><div className="text-lg font-semibold tabular-nums">{score.factsDiscovered.length}/{score.factsDiscovered.length + score.factsMissed.length}</div>info emerse</div>
          </div>
          <div className="space-y-3">
            {score.criteria.map((c) => (
              <div key={c.criterion}>
                <div className="mb-1 flex justify-between text-sm"><span>{c.criterion} <span className="text-xs text-muted-foreground">· {Math.round(c.weight * 100)}%</span></span><span className="font-medium tabular-nums">{c.score}</span></div>
                <Progress value={c.score} className="h-1.5" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={onRetry}><RotateCcw /> Riprova lo stesso scenario</Button>
            <Button variant="outline" onClick={onSettings}><Settings2 /> Cambia materia o impostazioni</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {config.summary && score.stats.messages > 0 && <MasteryImpact config={config} score={score} names={names} />}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Feedback del tutor AI</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!report ? <><Skeleton className="h-12" /><Skeleton className="h-24" /></> : (
              <>
                <p>{report.feedback}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-1.5 font-medium">✅ Punti di forza</div>
                    <ul className="space-y-1 text-muted-foreground">{report.strengths.map((s) => <li key={s}>• {s}</li>)}</ul>
                  </div>
                  <div>
                    <div className="mb-1.5 font-medium">⚠️ Da migliorare</div>
                    <ul className="space-y-1 text-muted-foreground">{report.improvements.length ? report.improvements.map((s) => <li key={s}>• {s}</li>) : <li>Niente di rilevante.</li>}</ul>
                  </div>
                </div>
                <div className="flex gap-2 rounded-md bg-accent/60 p-3"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="font-medium">Prossimo passo: </span>{report.nextStep}</span></div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Le informazioni del caso</CardTitle><CardDescription>Cosa sapeva il {scenario.counterpart_label.toLowerCase()} e a quale argomento del corso corrispondeva</CardDescription></CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <div className="mb-1.5 font-medium">Emerse</div>
              <ul className="space-y-1.5">
                {score.factsDiscovered.length ? score.factsDiscovered.map((f) => (
                  <li key={f.id} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-band-mastered" /><span>{f.fact}<span className="block text-xs text-muted-foreground">{names[f.topic_id]}</span></span></li>
                )) : <li className="text-muted-foreground">Nessuna</li>}
              </ul>
            </div>
            <div>
              <div className="mb-1.5 font-medium">Mancate · cosa avresti potuto chiedere</div>
              <ul className="space-y-1.5">
                {score.factsMissed.length ? score.factsMissed.map((f) => (
                  <li key={f.id} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-band-gap" /><span>{f.fact}<span className="block text-xs text-muted-foreground">{names[f.topic_id]} · {f.hint}</span></span></li>
                )) : <li className="text-muted-foreground">Nessuna: ottimo lavoro!</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Pagina ------------------------------------------------------------------
export function RoleplayPage() {
  const user = useCurrentUser();
  const { data: scenarios, isLoading } = useRoleplayScenarios();
  const { data: courses } = useStudentCourses(user.id);
  const [phase, setPhase] = useState<'setup' | 'session' | 'report'>('setup');
  const [config, setConfig] = useState<Config | undefined>();
  const [score, setScore] = useState<RoleplayScore | null>(null);
  const [run, setRun] = useState(0); // forza una sessione nuova su "Riprova"

  // nomi dei topic: dai corsi dello studente, o caricati per le anteprime di altri corsi
  const previewCourseId = scenarios?.find((s) => courses && !courses.some((c) => c.course.id === s.course_id))?.course_id;
  const { data: previewTopics } = useTopics(previewCourseId);
  const topicNames = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const c of courses ?? []) map[c.course.id] = Object.fromEntries(c.topics.map((t) => [t.id, t.name]));
    for (const t of previewTopics ?? []) (map[t.course_id] ??= {})[t.id] = t.name;
    return map;
  }, [courses, previewTopics]);
  const namesFor = (courseId: string) => topicNames[courseId] ?? {};
  const names = config ? namesFor(config.scenario.course_id) : {};

  return (
    <>
      <PageHeader
        title="Simulatore di consulenza"
        description="Preparati a un esame mettendo in pratica i suoi argomenti: un cliente o un paziente interpretato dall'AI ti porta un caso reale."
      />
      {phase === 'setup' && <ActivityIntro />}
      {isLoading || !scenarios || !courses ? <LoadingBlock rows={2} /> : scenarios.length === 0 ? (
        <EmptyState icon={Theater} title="Nessuno scenario disponibile" description="Per le tue materie non ci sono ancora simulazioni." />
      ) : (
        <>
          {phase === 'setup' && <Setup scenarios={scenarios} courses={courses} topicNames={namesFor} initial={config} onStart={(c) => { setConfig(c); setRun((r) => r + 1); setPhase('session'); }} />}
          {phase === 'session' && config && <Session key={run} config={config} names={names} onFinish={(s) => { setScore(s); setPhase('report'); }} onExit={() => setPhase('setup')} />}
          {phase === 'report' && config && score && (
            <Report key={run} config={config} score={score} names={names} onRetry={() => {
              // aggiorna la fotografia della materia (il mastery è cambiato dopo la sessione precedente)
              setConfig((c) => c && ({ ...c, summary: courses.find((x) => x.course.id === c.scenario.course_id) ?? null }));
              setRun((r) => r + 1); setPhase('session');
            }} onSettings={() => setPhase('setup')} />
          )}
        </>
      )}
    </>
  );
}
