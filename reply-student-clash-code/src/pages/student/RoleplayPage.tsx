import { useState } from 'react';
import { ClipboardCheck, Send, Theater, UserRound, Eye, EyeOff } from 'lucide-react';
import { useRoleplayScenarios } from '@/data/hooks';
import { ai, type ChatTurn, type RoleplayReport } from '@/ai/client';
import type { RoleplayScenario } from '@/types/database';
import { PageHeader, LoadingBlock } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function Session({ scenario, onExit }: { scenario: RoleplayScenario; onExit: () => void }) {
  const [turns, setTurns] = useState<ChatTurn[]>([{ role: 'assistant', content: scenario.persona.opening_line }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<RoleplayReport | null>(null);
  const [showRubric, setShowRubric] = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input;
    setInput('');
    setBusy(true);
    setTurns((t) => [...t, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);
    for await (const tok of ai.roleplayReply({ scenario, history: turns, message: msg })) {
      setTurns((t) => { const c = [...t]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + tok }; return c; });
    }
    setBusy(false);
  };
  const finish = async () => { setBusy(true); setReport(await ai.evaluateRoleplay({ scenario, history: turns })); setBusy(false); };

  if (report)
    return (
      <Card>
        <CardHeader><CardTitle>Report della simulazione</CardTitle><CardDescription>{scenario.title}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="text-4xl font-semibold tabular-nums">{report.totalScore}<span className="text-lg text-muted-foreground">/100</span></div>
          <div className="grid gap-3 md:grid-cols-2">
            {report.criteria.map((c) => (
              <div key={c.criterion} className="rounded-md border p-3">
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{c.criterion}</span><span className="tabular-nums">{c.score}</span></div>
                <Progress value={c.score} className="h-1.5" />
                <div className="mt-1.5 text-xs text-muted-foreground">{c.comment}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div><div className="mb-1 font-medium">✅ Informazioni emerse</div><ul className="list-disc pl-5 text-muted-foreground">{report.factsDiscovered.length ? report.factsDiscovered.map((f) => <li key={f}>{f}</li>) : <li>Nessuna</li>}</ul></div>
            <div><div className="mb-1 font-medium">❌ Informazioni mancate</div><ul className="list-disc pl-5 text-muted-foreground">{report.factsMissed.map((f) => <li key={f}>{f}</li>)}</ul></div>
          </div>
          <p className="rounded-md bg-accent/60 p-3 text-sm">{report.feedback}</p>
          <Button onClick={onExit}>Nuova simulazione</Button>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="flex h-[600px] flex-col lg:col-span-2">
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><UserRound className="h-5 w-5 text-accent-foreground" /></div>
          <div className="flex-1"><CardTitle>{scenario.persona.name}</CardTitle><CardDescription>{scenario.persona.role}{scenario.persona.age ? ` · ${scenario.persona.age} anni` : ''}</CardDescription></div>
          <Button variant="outline" size="sm" onClick={finish} disabled={busy || turns.length < 3}><ClipboardCheck /> Termina e valuta</Button>
        </CardHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {turns.map((t, i) => (
            <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-lg px-4 py-2.5 text-sm', t.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>{t.content || '…'}</div>
            </div>
          ))}
        </div>
        <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Fai una domanda…" />
          <Button type="submit" size="icon" disabled={busy}><Send /></Button>
        </form>
      </Card>
      <Card>
        <CardHeader><CardTitle>Obiettivo</CardTitle><CardDescription>{scenario.description}</CardDescription></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowRubric(!showRubric)}>{showRubric ? <EyeOff /> : <Eye />} Rubrica di valutazione</Button>
          {showRubric && scenario.rubric.map((r) => <div key={r.criterion}><span className="font-medium">{r.criterion}</span> <span className="text-muted-foreground">({Math.round(r.weight * 100)}%) – {r.description}</span></div>)}
          <p className="text-xs text-muted-foreground">Il personaggio ha {scenario.hidden_facts.length} informazioni nascoste: emergono solo con le domande giuste.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function RoleplayPage() {
  const { data: scenarios, isLoading } = useRoleplayScenarios();
  const [active, setActive] = useState<RoleplayScenario | null>(null);
  return (
    <>
      <PageHeader title="Simulatore" description="Allenati con l'AI che interpreta un paziente, un cliente o un professore. A fine sessione ricevi un report con punteggio e feedback." />
      {active ? <Session scenario={active} onExit={() => setActive(null)} /> : isLoading ? <LoadingBlock rows={2} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {scenarios?.map((s) => (
            <Card key={s.id}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Theater className="h-4 w-4 text-primary" /> {s.title}</CardTitle><CardDescription>{s.description}</CardDescription></CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">con {s.persona.name}</span>
                <Button onClick={() => setActive(s)}>Inizia</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
