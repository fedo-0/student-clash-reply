/**
 * Annuncio d'esame "alla LinkedIn": l'esame è l'offerta, il docente l'azienda, lo studente il candidato.
 * Usato dallo studente (sezione Esami) e dal docente come anteprima.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarDays, Check, CheckCircle2, CircleDashed, Clock, Download, FileText, Gauge, GraduationCap, HelpCircle,
  Loader2, Mic, RefreshCw, Sparkles, Target, Wrench, XCircle, AlertTriangle, ArrowRight, Layers,
} from 'lucide-react';
import type { ExamMatch, ExamMatchStatus, ExamPosting, ExamRequirement, ExamRequirementKind, Profile } from '@/types/database';
import type { ExamPostingView } from '@/types/domain';
import { MATCH_WEIGHTS, STATUS_LABEL } from '@/lib/examMatch';
import { daysUntil, fmtCountdown, fmtDate, today } from '@/lib/dates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ReadinessRing, readinessBand } from '@/components/mastery';
import { cn } from '@/lib/utils';

// ---- Etichette ---------------------------------------------------------------
export const FORMAT_LABEL: Record<ExamPosting['format']['type'], string> = {
  written: 'Scritto',
  oral: 'Orale',
  written_oral: 'Scritto + orale',
  project_oral: 'Project work + orale',
};
export const LEVEL_LABEL: Record<ExamPosting['level'], string> = { base: 'Base', intermediate: 'Intermedio', advanced: 'Avanzato' };
const KIND_SECTION: { kind: ExamRequirementKind[]; title: string; icon: typeof Target }[] = [
  { kind: ['competence'], title: 'Competenze richieste', icon: Target },
  { kind: ['skill'], title: 'Skill', icon: Sparkles },
  { kind: ['tool'], title: 'Strumenti e framework', icon: Wrench },
  { kind: ['prerequisite'], title: 'Propedeuticità', icon: GraduationCap },
];
const MATERIAL_LABEL = { past_exam: "Prova d'esame", mockup: 'Simulazione / mockup', solutions: 'Soluzioni' } as const;

const STATUS_STYLE: Record<ExamMatchStatus, { icon: typeof Check; cls: string; badge: 'mastered' | 'consolidating' | 'gap' | 'unverified' | 'outline' }> = {
  met: { icon: CheckCircle2, cls: 'text-band-mastered', badge: 'mastered' },
  partial: { icon: AlertTriangle, cls: 'text-band-consolidating', badge: 'consolidating' },
  gap: { icon: XCircle, cls: 'text-band-gap', badge: 'gap' },
  unverified: { icon: HelpCircle, cls: 'text-muted-foreground', badge: 'unverified' },
  new: { icon: CircleDashed, cls: 'text-muted-foreground', badge: 'outline' },
};

export function CourseLogo({ code, className }: { code: string; className?: string }) {
  const label = code.split('-').pop()!.slice(0, 3);
  return <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary', className)}>{label}</div>;
}

export function matchBadgeVariant(score: number) {
  return readinessBand(score);
}

const postedAgo = (iso: string | null) => {
  if (!iso) return 'bozza';
  const d = Math.round((today().getTime() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : d < 14 ? `${d} giorni fa` : `${Math.round(d / 7)} settimane fa`;
};

// ---- Card della lista ----------------------------------------------------------
export function ExamPostingCard({ view, active, onClick }: { view: ExamPostingView; active?: boolean; onClick?: () => void }) {
  const { posting, course, teacher, nextSession, match } = view;
  const competences = posting.requirements.filter((r) => r.kind === 'competence').length;
  return (
    <button onClick={onClick} className={cn('flex w-full gap-3 border-b p-4 text-left transition-colors last:border-b-0', active ? 'border-l-2 border-l-primary bg-accent/60' : 'hover:bg-muted/50')}>
      <CourseLogo code={course.code} />
      <div className="min-w-0 flex-1">
        <div className={cn('font-semibold leading-tight', active && 'text-primary')}>{course.name}</div>
        <div className="text-sm">{teacher?.full_name}</div>
        <div className="text-xs text-muted-foreground">{FORMAT_LABEL[posting.format.type]} · {course.cfu} CFU · {LEVEL_LABEL[posting.level]}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          {nextSession && <span className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="h-3 w-3" /> {fmtCountdown(daysUntil(nextSession.date))}</span>}
          <span className="text-muted-foreground">· {competences} competenze</span>
        </div>
        <div className="mt-2">
          {match
            ? <Badge variant={matchBadgeVariant(match.score)}><Sparkles className="h-3 w-3" /> Corrispondenza {match.score}%</Badge>
            : <span className="text-xs font-medium text-primary">Genera la tua corrispondenza →</span>}
        </div>
      </div>
    </button>
  );
}

// ---- Requisiti -----------------------------------------------------------------
function RequirementRow({ r, status }: { r: ExamRequirement; status?: ExamMatchStatus }) {
  const s = status ? STATUS_STYLE[status] : null;
  return (
    <li className="flex items-start gap-2.5 py-2">
      {s ? <s.icon className={cn('mt-0.5 h-4 w-4 shrink-0', s.cls)} /> : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />}
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{r.label}</span>
        {r.importance === 'nice_to_have' && <span className="ml-1.5 text-xs text-muted-foreground">(gradito)</span>}
        {r.description && <span className="block text-xs text-muted-foreground">{r.description}</span>}
      </div>
      {r.kind === 'competence' && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{Math.round(r.weight * 100)}% dell'esame</span>}
    </li>
  );
}

export function RequirementsSection({ posting, match }: { posting: ExamPosting; match?: ExamMatch | null }) {
  const statusOf = (id: string) => match?.items.find((i) => i.requirement_id === id)?.status;
  return (
    <div className="space-y-5">
      {KIND_SECTION.map((sec) => {
        const list = posting.requirements.filter((r) => sec.kind.includes(r.kind));
        if (!list.length) return null;
        return (
          <div key={sec.title}>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><sec.icon className="h-4 w-4 text-primary" /> {sec.title}</div>
            <ul className="divide-y">{list.map((r) => <RequirementRow key={r.id} r={r} status={statusOf(r.id)} />)}</ul>
          </div>
        );
      })}
      {match && (
        <div className="flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
          {(Object.keys(STATUS_STYLE) as ExamMatchStatus[]).map((st) => {
            const S = STATUS_STYLE[st];
            return <span key={st} className="flex items-center gap-1"><S.icon className={cn('h-3.5 w-3.5', S.cls)} /> {STATUS_LABEL[st]}</span>;
          })}
        </div>
      )}
    </div>
  );
}

// ---- Generazione in corso ------------------------------------------------------
const STEPS = [
  "Leggo i requisiti pubblicati dal docente",
  'Controllo libretto e propedeuticità',
  'Confronto CV, skill e progetti',
  'Misuro il tuo livello sugli argomenti richiesti',
  "Scrivo l'elaborato",
];

function Generating() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 520); return () => clearInterval(t); }, []);
  return (
    <Card className="border-primary/40">
      <CardContent className="space-y-2.5 p-6">
        <div className="mb-2 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" /> L'AI sta analizzando il tuo profilo…</div>
        {STEPS.map((s, i) => (
          <div key={s} className={cn('flex items-center gap-2 text-sm transition-opacity', i > step && 'opacity-40')}>
            {i < step ? <Check className="h-4 w-4 text-band-mastered" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CircleDashed className="h-4 w-4" />}
            {s}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---- Elaborato AI ----------------------------------------------------------------
export function ExamMatchReportCard({ posting, match, onRegenerate, regenerating }: { posting: ExamPosting; match: ExamMatch; onRegenerate?: () => void; regenerating?: boolean }) {
  const [voiceInfo, setVoiceInfo] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const reqById = new Map(posting.requirements.map((r) => [r.id, r]));
  const comps = [
    ['Competenze', match.components.competences, MATCH_WEIGHTS.competences],
    ['Skill e strumenti', match.components.skills, MATCH_WEIGHTS.skills],
    ['Propedeuticità', match.components.prerequisites, MATCH_WEIGHTS.prerequisites],
  ] as const;

  return (
    <Card className="overflow-hidden border-primary/40">
      <div className="flex items-center gap-2 border-b bg-gradient-to-r from-accent to-card px-5 py-3 text-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold">Corrispondenza esame-profilo</span>
        <span className="text-muted-foreground">· elaborato AI del {fmtDate(match.generated_at, { day: 'numeric', month: 'long' })}</span>
        {onRegenerate && <Button size="sm" variant="ghost" className="ml-auto" onClick={onRegenerate} disabled={regenerating}><RefreshCw className={cn(regenerating && 'animate-spin')} /> Rigenera</Button>}
      </div>
      <CardContent className="space-y-6 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ReadinessRing value={match.score} size={120} stroke={11} label="match" />
          <div className="flex-1 space-y-2.5">
            {comps.map(([label, v, w]) => v == null ? null : (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs"><span>{label} <span className="text-muted-foreground">· peso {Math.round(w * 100)}%</span></span><span className="tabular-nums">{v}</span></div>
                <Progress value={v} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm leading-relaxed">{match.summary}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-band-mastered/30 bg-band-mastered/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-band-mastered" /> Punti di forza</div>
            <ul className="space-y-1.5 text-sm">{match.strengths.map((s) => <li key={s}>• {s}</li>)}</ul>
          </div>
          <div className="rounded-md border border-band-gap/30 bg-band-gap/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-band-gap" /> Punti deboli</div>
            <ul className="space-y-1.5 text-sm">{match.weaknesses.length ? match.weaknesses.map((s) => <li key={s}>• {s}</li>) : <li>Nessun punto debole rilevante.</li>}</ul>
          </div>
        </div>

        {match.improvements.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Dove migliorare</div>
            <div className="grid gap-2 md:grid-cols-2">
              {match.improvements.map((imp, i) => {
                const body = (
                  <>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{imp.title}</span><span className="block text-xs text-muted-foreground">{imp.detail}</span></span>
                    {imp.link && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                  </>
                );
                return imp.link
                  ? <Link key={imp.title} to={imp.link} className="flex gap-3 rounded-md border p-3 transition-colors hover:border-primary">{body}</Link>
                  : <div key={imp.title} className="flex gap-3 rounded-md border p-3">{body}</div>;
              })}
            </div>
          </div>
        )}

        {match.strategy.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" /> Come affrontare questo esame</div>
            <ul className="space-y-1 text-sm text-muted-foreground">{match.strategy.map((s) => <li key={s}>• {s}</li>)}</ul>
          </div>
        )}

        <div>
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowDetail(!showDetail)}>{showDetail ? 'Nascondi' : 'Mostra'} il dettaglio requisito per requisito</Button>
          {showDetail && (
            <ul className="mt-2 divide-y rounded-md border">
              {match.items.map((it) => {
                const r = reqById.get(it.requirement_id);
                if (!r) return null;
                const S = STATUS_STYLE[it.status];
                return (
                  <li key={it.requirement_id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start">
                    <div className="flex flex-1 items-start gap-2 text-sm">
                      <S.icon className={cn('mt-0.5 h-4 w-4 shrink-0', S.cls)} />
                      <span><span className="font-medium">{r.label}</span><span className="block text-xs text-muted-foreground">{it.evidence.join(' · ')}</span></span>
                    </div>
                    <div className="flex items-center gap-2 pl-6 sm:pl-0">
                      <Badge variant={S.badge}>{STATUS_LABEL[it.status]}</Badge>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{it.score}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <div className="font-medium">Hai dubbi su come affrontarlo?</div>
            <div className="text-muted-foreground">Parla a voce con il coach AI di questo esame, dei tuoi punti deboli e di come presentarti.</div>
          </div>
          <Button variant="outline" onClick={() => setVoiceInfo(true)}><Mic /> Parla con il coach vocale</Button>
        </div>
        {voiceInfo && <p className="-mt-3 text-xs text-muted-foreground">Il coach vocale arriverà nella prossima versione del prototipo.</p>}
      </CardContent>
    </Card>
  );
}

// ---- Annuncio completo -----------------------------------------------------------
export function ExamPostingDetail({ view, teacher, mode = 'student', onGenerate, generating }: {
  view: Pick<ExamPostingView, 'posting' | 'course' | 'nextSession' | 'match' | 'readiness'>;
  teacher: Profile | null;
  mode?: 'student' | 'preview';
  onGenerate?: () => void;
  generating?: boolean;
}) {
  const { posting, course, nextSession, match, readiness } = view;
  const days = daysUntil(nextSession?.date);
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-4">
            <CourseLogo code={course.code} className="h-14 w-14 text-base" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold leading-tight md:text-2xl">{posting.title}</h2>
              <div className="mt-0.5 text-sm">{teacher?.full_name} · {course.degree_program}</div>
              <div className="text-xs text-muted-foreground">Pubblicato {postedAgo(posting.published_at)}{nextSession && ` · appello ${fmtDate(nextSession.date, { day: 'numeric', month: 'long', year: 'numeric' })} (${fmtCountdown(days)})`}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary"><BookOpen className="h-3 w-3" /> {FORMAT_LABEL[posting.format.type]}</Badge>
            {posting.format.duration_min && <Badge variant="secondary"><Clock className="h-3 w-3" /> {posting.format.duration_min} min</Badge>}
            <Badge variant="secondary"><Gauge className="h-3 w-3" /> Livello {LEVEL_LABEL[posting.level].toLowerCase()}</Badge>
            <Badge variant="secondary">{course.cfu} CFU</Badge>
            <Badge variant="secondary">{posting.requirements.filter((r) => r.kind === 'competence').length} competenze richieste</Badge>
          </div>
          {mode === 'student' && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {!match && <Button size="lg" onClick={onGenerate} disabled={generating}>{generating ? <Loader2 className="animate-spin" /> : <Sparkles />} Genera la corrispondenza con l'AI</Button>}
              {readiness != null && (
                <Button size="lg" variant="outline" asChild><Link to={`/student/exams/${course.id}/preparazione`}>Preparazione dettagliata · readiness {Math.round(readiness)}%</Link></Button>
              )}
            </div>
          )}
          {mode === 'student' && !match && !generating && (
            <p className="mt-2 text-xs text-muted-foreground">L'AI confronta i requisiti con il tuo libretto, il CV, i progetti e il tuo livello sugli argomenti, e scrive un elaborato con punti di forza, punti deboli e dove migliorare.</p>
          )}
        </CardContent>
      </Card>

      {mode === 'student' && generating && <Generating />}
      {mode === 'student' && match && !generating && <ExamMatchReportCard posting={posting} match={match} onRegenerate={onGenerate} regenerating={generating} />}

      <Card>
        <CardHeader><CardTitle>Informazioni sull'esame</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="leading-relaxed">{posting.about}</p>
          {posting.learning_outcomes.length > 0 && (
            <div>
              <div className="mb-1.5 font-semibold">Cosa devi saper fare</div>
              <ul className="space-y-1">{posting.learning_outcomes.map((o) => <li key={o} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{o}</li>)}</ul>
            </div>
          )}
          <div className="grid gap-2 rounded-md bg-muted/60 p-3 sm:grid-cols-2">
            <div><span className="text-muted-foreground">Formato: </span>{FORMAT_LABEL[posting.format.type]}{posting.format.duration_min ? `, ${posting.format.duration_min} minuti` : ''}</div>
            {posting.format.allowed_materials && <div><span className="text-muted-foreground">Materiale ammesso: </span>{posting.format.allowed_materials}</div>}
            {posting.format.grading && <div className="sm:col-span-2"><span className="text-muted-foreground">Valutazione: </span>{posting.format.grading}</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requisiti</CardTitle>
          <CardDescription>{match ? 'Confrontati con il tuo profilo' : 'Pubblicati dal docente'}</CardDescription>
        </CardHeader>
        <CardContent><RequirementsSection posting={posting} match={mode === 'student' ? match : null} /></CardContent>
      </Card>

      {posting.materials.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Prove d'esame e materiali</CardTitle><CardDescription>Caricati dal docente per mostrare cosa si aspetta</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {posting.materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{MATERIAL_LABEL[m.kind]}{m.pages ? ` · ${m.pages} pagine` : ''}</div>
                  </div>
                  <Button variant="ghost" size="icon" title="Scarica (prototipo)" disabled><Download /></Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
