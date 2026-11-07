import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eye, FileText, Pencil, Plus, Save, Sparkles, Trash2, Upload, Users, X } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useTeacherExamPostings, useUpdateExamPosting } from '@/data/hooks';
import type { ExamMaterial, ExamPosting, ExamRequirement, ExamRequirementImportance, Topic } from '@/types/database';
import type { TeacherPostingView } from '@/types/domain';
import { PageHeader, LoadingBlock, StatCard } from '@/components/common';
import { ExamPostingDetail, FORMAT_LABEL, LEVEL_LABEL } from '@/components/exams/ExamPosting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const MATERIAL_KINDS: { id: ExamMaterial['kind']; label: string }[] = [
  { id: 'past_exam', label: "Prova d'esame" },
  { id: 'mockup', label: 'Mockup / simulazione' },
  { id: 'solutions', label: 'Soluzioni' },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

// ---- Editor --------------------------------------------------------------------
function PostingEditor({ view, onSaved }: { view: TeacherPostingView; onSaved: () => void }) {
  const save = useUpdateExamPosting();
  const [p, setP] = useState<ExamPosting>(view.posting);
  const [dirty, setDirty] = useState(false);
  const [newSkill, setNewSkill] = useState({ label: '', kind: 'skill' as 'skill' | 'tool', importance: 'required' as ExamRequirementImportance });
  const [newPrereq, setNewPrereq] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [materialKind, setMaterialKind] = useState<ExamMaterial['kind']>('past_exam');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setP(view.posting); setDirty(false); }, [view.posting]);

  const update = (patch: Partial<ExamPosting>) => { setP((x) => ({ ...x, ...patch })); setDirty(true); };
  const updateReq = (id: string, patch: Partial<ExamRequirement>) => update({ requirements: p.requirements.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeReq = (id: string) => update({ requirements: p.requirements.filter((r) => r.id !== id) });
  const addReq = (r: Omit<ExamRequirement, 'id'>) => update({ requirements: [...p.requirements, { ...r, id: newId('req') }] });

  const competences = p.requirements.filter((r) => r.kind === 'competence');
  const skillsTools = p.requirements.filter((r) => r.kind === 'skill' || r.kind === 'tool');
  const prereqs = p.requirements.filter((r) => r.kind === 'prerequisite');
  const weightSum = Math.round(competences.reduce((s, r) => s + r.weight, 0) * 100);

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: ExamMaterial[] = [...files].map((f) => ({ id: newId('mat'), kind: materialKind, title: f.name.replace(/\.pdf$/i, ''), document_id: null }));
    update({ materials: [...p.materials, ...added] });
  };

  const submit = () => save.mutate({ ...p, status: 'published', published_at: p.published_at ?? new Date().toISOString() }, { onSuccess: () => { setDirty(false); onSaved(); } });

  return (
    <div className="space-y-4">
      <Section title="Annuncio" description="Come gli studenti vedranno il tuo esame">
        <Input value={p.title} onChange={(e) => update({ title: e.target.value })} placeholder="Titolo" />
        <Textarea rows={4} value={p.about} onChange={(e) => update({ about: e.target.value })} placeholder="Informazioni sull'esame: cosa cerchi negli studenti, com'è strutturata la prova…" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Formato</div>
            <select className="h-10 w-full rounded-md border bg-card px-2 text-sm" value={p.format.type} onChange={(e) => update({ format: { ...p.format, type: e.target.value as ExamPosting['format']['type'] } })}>
              {Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Durata (minuti)</div>
            <Input type="number" value={p.format.duration_min ?? ''} onChange={(e) => update({ format: { ...p.format, duration_min: e.target.value ? Number(e.target.value) : null } })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Materiale ammesso</div>
            <Input value={p.format.allowed_materials ?? ''} onChange={(e) => update({ format: { ...p.format, allowed_materials: e.target.value || null } })} />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Livello</div>
            <div className="flex gap-1">
              {(Object.keys(LEVEL_LABEL) as ExamPosting['level'][]).map((l) => (
                <Button key={l} type="button" size="sm" variant={p.level === l ? 'default' : 'outline'} className="flex-1" onClick={() => update({ level: l })}>{LEVEL_LABEL[l]}</Button>
              ))}
            </div>
          </div>
        </div>
        <Input value={p.format.grading ?? ''} onChange={(e) => update({ format: { ...p.format, grading: e.target.value || null } })} placeholder="Valutazione (es. 5 esercizi per 30 punti)" />
      </Section>

      <Section title="Cosa devono saper fare" description="Risultati di apprendimento attesi">
        <ul className="space-y-1.5">
          {p.learning_outcomes.map((o, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /><span className="flex-1">{o}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ learning_outcomes: p.learning_outcomes.filter((_, k) => k !== i) })}><X /></Button>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newOutcome.trim()) { update({ learning_outcomes: [...p.learning_outcomes, newOutcome.trim()] }); setNewOutcome(''); } }}>
          <Input value={newOutcome} onChange={(e) => setNewOutcome(e.target.value)} placeholder="Aggiungi un risultato atteso…" />
          <Button type="submit" variant="outline" size="icon"><Plus /></Button>
        </form>
      </Section>

      <Section title="Competenze richieste" description="Ogni competenza ha un peso nell'esame ed è collegata agli argomenti del corso: così misuriamo il livello degli studenti.">
        {competences.map((r) => (
          <div key={r.id} className="space-y-2 rounded-md border p-3">
            <div className="flex gap-2">
              <Input value={r.label} onChange={(e) => updateReq(r.id, { label: e.target.value })} />
              <Button variant="ghost" size="icon" onClick={() => removeReq(r.id)}><Trash2 /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {view.topics.map((t: Topic) => {
                const on = r.topic_ids?.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => updateReq(r.id, { topic_ids: on ? r.topic_ids!.filter((x) => x !== t.id) : [...(r.topic_ids ?? []), t.id] })}>
                    <Badge variant={on ? 'default' : 'outline'} className="font-normal">{t.name}</Badge>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 text-xs text-muted-foreground">Peso {Math.round(r.weight * 100)}%</span>
              <Slider min={0} max={0.5} step={0.05} value={[r.weight]} onValueChange={([w]) => updateReq(r.id, { weight: w })} />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className={cn('text-xs', weightSum === 100 ? 'text-muted-foreground' : 'text-band-consolidating')}>Somma dei pesi: {weightSum}%{weightSum !== 100 && ' (consigliato 100%)'}</span>
          <Button variant="outline" size="sm" onClick={() => addReq({ kind: 'competence', label: 'Nuova competenza', importance: 'required', weight: 0.1, topic_ids: [] })}><Plus /> Competenza</Button>
        </div>
      </Section>

      <Section title="Skill, strumenti e framework" description="Cosa serve oltre agli argomenti del corso (software, linguaggi, capacità)">
        <div className="flex flex-wrap gap-1.5">
          {skillsTools.map((r) => (
            <Badge key={r.id} variant={r.importance === 'required' ? 'default' : 'secondary'} className="gap-1.5 py-1">
              {r.kind === 'tool' ? '🛠' : '✦'} {r.label}{r.importance === 'nice_to_have' && ' · gradito'}
              <button onClick={() => removeReq(r.id)}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (!newSkill.label.trim()) return;
          addReq({ kind: newSkill.kind, label: newSkill.label.trim(), importance: newSkill.importance, weight: newSkill.importance === 'required' ? 1 : 0.5 });
          setNewSkill((s) => ({ ...s, label: '' }));
        }}>
          <Input className="min-w-[160px] flex-1" value={newSkill.label} onChange={(e) => setNewSkill((s) => ({ ...s, label: e.target.value }))} placeholder="Es. Python, Excel Solver, MATLAB…" />
          <select className="h-10 rounded-md border bg-card px-2 text-sm" value={newSkill.kind} onChange={(e) => setNewSkill((s) => ({ ...s, kind: e.target.value as 'skill' | 'tool' }))}>
            <option value="skill">Skill</option><option value="tool">Strumento / framework</option>
          </select>
          <select className="h-10 rounded-md border bg-card px-2 text-sm" value={newSkill.importance} onChange={(e) => setNewSkill((s) => ({ ...s, importance: e.target.value as ExamRequirementImportance }))}>
            <option value="required">Richiesto</option><option value="nice_to_have">Gradito</option>
          </select>
          <Button type="submit" variant="outline" size="icon"><Plus /></Button>
        </form>
      </Section>

      <Section title="Propedeuticità" description="Esami che conviene aver già superato">
        <div className="flex flex-wrap gap-1.5">
          {prereqs.map((r) => (
            <Badge key={r.id} variant="secondary" className="gap-1.5 py-1">{r.label}<button onClick={() => removeReq(r.id)}><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newPrereq.trim()) { addReq({ kind: 'prerequisite', label: newPrereq.trim(), exam_name: newPrereq.trim(), importance: 'required', weight: 1 }); setNewPrereq(''); } }}>
          <Input value={newPrereq} onChange={(e) => setNewPrereq(e.target.value)} placeholder="Nome dell'esame (come nel libretto)" />
          <Button type="submit" variant="outline" size="icon"><Plus /></Button>
        </form>
      </Section>

      <Section title="Prove d'esame e mockup" description="Carica vecchie prove o simulazioni: aiutano gli studenti a capire cosa ti aspetti">
        <ul className="divide-y">
          {p.materials.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{m.title}</span>
              <Badge variant="outline">{MATERIAL_KINDS.find((k) => k.id === m.kind)?.label}</Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ materials: p.materials.filter((x) => x.id !== m.id) })}><X /></Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <select className="h-10 rounded-md border bg-card px-2 text-sm" value={materialKind} onChange={(e) => setMaterialKind(e.target.value as ExamMaterial['kind'])}>
            {MATERIAL_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <input ref={fileRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload /> Carica PDF</Button>
        </div>
        <p className="text-xs text-muted-foreground">Prototipo: il file non viene salvato, viene aggiunto solo il riferimento. In seguito l'AI estrarrà dalle prove competenze e argomenti.</p>
      </Section>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-lg border bg-card/95 p-3 shadow-lg backdrop-blur">
        <span className="text-sm text-muted-foreground">{dirty ? 'Modifiche non pubblicate' : save.isSuccess ? 'Pubblicato ✓' : 'Annuncio pubblicato'}</span>
        <Button onClick={submit} disabled={!dirty || save.isPending}><Save /> Pubblica modifiche</Button>
      </div>
    </div>
  );
}

// ---- Pagina --------------------------------------------------------------------
export function ExamPostingsPage() {
  const user = useCurrentUser();
  const { data: views, isLoading } = useTeacherExamPostings(user.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const selected = views?.find((v) => v.posting.id === selectedId) ?? views?.[0];

  return (
    <>
      <PageHeader
        title="Annunci d'esame"
        description="Pubblica il tuo esame come un annuncio: competenze, skill, framework e prove passate. Gli studenti vedono quanto il loro profilo corrisponde e su cosa migliorare."
      />
      {isLoading || !views ? <LoadingBlock rows={3} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {views.map((v) => (
              <button key={v.posting.id} onClick={() => setSelectedId(v.posting.id)} className="text-left">
                <Card className={cn('h-full transition-all', selected?.posting.id === v.posting.id ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50')}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-semibold">{v.course.name}</span>
                      <Badge variant={v.posting.status === 'published' ? 'mastered' : 'secondary'}>{v.posting.status === 'published' ? 'Pubblicato' : 'Bozza'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{v.posting.requirements.length} requisiti · {v.posting.materials.length} materiali</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.matchesCount} corrispondenze generate</span>
                      {v.avgMatch != null && <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> media {v.avgMatch}%</span>}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>

          {selected && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Competenze richieste" value={selected.posting.requirements.filter((r) => r.kind === 'competence').length} />
                <StatCard label="Skill e strumenti" value={selected.posting.requirements.filter((r) => r.kind === 'skill' || r.kind === 'tool').length} />
                <StatCard label="Corrispondenze generate" value={selected.matchesCount} hint="dagli studenti del corso" />
                <StatCard label="Corrispondenza media" value={selected.avgMatch != null ? `${selected.avgMatch}%` : '—'} hint="solo dati aggregati" />
              </div>
              <div className="mb-4 inline-flex rounded-md bg-muted p-1">
                <button onClick={() => setTab('edit')} className={cn('flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium', tab === 'edit' ? 'bg-card shadow-sm' : 'text-muted-foreground')}><Pencil className="h-3.5 w-3.5" /> Modifica</button>
                <button onClick={() => setTab('preview')} className={cn('flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium', tab === 'preview' ? 'bg-card shadow-sm' : 'text-muted-foreground')}><Eye className="h-3.5 w-3.5" /> Anteprima studente</button>
              </div>
              <div className="max-w-4xl">
                {/* l'editor resta montato per non perdere le modifiche passando all'anteprima */}
                <div className={cn(tab !== 'edit' && 'hidden')}><PostingEditor key={selected.posting.id} view={selected} onSaved={() => undefined} /></div>
                {tab === 'preview' && (
                  <>
                    <p className="mb-3 text-sm text-muted-foreground">Così vedono l'annuncio gli studenti (versione pubblicata).</p>
                    <ExamPostingDetail view={{ ...selected, nextSession: null, match: null, readiness: null }} teacher={user} mode="preview" />
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
