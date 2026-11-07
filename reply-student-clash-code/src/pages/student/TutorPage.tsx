import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, FileText, GraduationCap, Mic, Send, Target } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useStudentCourses } from '@/data/hooks';
import { ai, type ChatTurn } from '@/ai/client';
import type { ChatMode, Citation } from '@/types/database';
import { PageHeader, RichText } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Msg extends ChatTurn { citations?: Citation[] }

const MODES: { id: ChatMode; label: string; icon: typeof Bot; hint: string }[] = [
  { id: 'tutor', label: 'Domanda libera', icon: Bot, hint: 'Risposte basate sui materiali del corso, con citazioni.' },
  { id: 'guided_gap', label: 'Sessione su una lacuna', icon: Target, hint: 'Approccio socratico + esercizio finale che aggiorna il tuo livello.' },
  { id: 'oral_exam', label: 'Interrogazione orale', icon: GraduationCap, hint: 'Il tutor ti interroga come all\'orale.' },
];

export function TutorPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const { data: courses } = useStudentCourses(user.id);
  const courseId = params.get('course') ?? courses?.[0]?.course.id;
  const mode = (params.get('mode') as ChatMode) ?? 'tutor';
  const summary = courses?.find((c) => c.course.id === courseId);
  const topic = summary?.topics.find((t) => t.id === params.get('topic'));

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { setMessages([]); }, [courseId, mode, topic?.id]);

  const setParam = (k: string, v: string | null) => setParams((p) => { if (v) p.set(k, v); else p.delete(k); return p; });

  const send = async (text: string) => {
    if (!text.trim() || !courseId || busy) return;
    setInput('');
    setBusy(true);
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    for await (const chunk of ai.chatStream({ mode, courseId, topic, history, message: text })) {
      setMessages((m) => {
        const copy = [...m];
        const last = { ...copy[copy.length - 1] };
        if (chunk.type === 'token') last.content += chunk.value;
        if (chunk.type === 'citations') last.citations = chunk.value;
        copy[copy.length - 1] = last;
        return copy;
      });
    }
    setBusy(false);
  };

  const starters = mode === 'guided_gap' && topic ? [`Iniziamo con ${topic.name}`] : mode === 'oral_exam' ? ['Sono pronto, iniziamo'] : ['Come si costruisce il duale?', 'Cosa rappresenta un prezzo ombra?', 'Quando poto un nodo nel branch and bound?'];

  return (
    <>
      <PageHeader title="Tutor AI" description="Ancorato ai materiali del tuo corso: ogni risposta cita documento e pagina." actions={<Button variant="outline" disabled title="In arrivo"><Mic /> Voce (presto)</Button>} />
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4">
          <Card><CardContent className="space-y-2 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Corso</div>
            {courses?.map((c) => (
              <button key={c.course.id} onClick={() => setParams({ course: c.course.id, mode })} className={cn('w-full rounded-md px-3 py-2 text-left text-sm', c.course.id === courseId ? 'bg-accent font-medium text-accent-foreground' : 'hover:bg-muted')}>{c.course.name}</button>
            ))}
          </CardContent></Card>
          <Card><CardContent className="space-y-2 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modalità</div>
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setParam('mode', m.id)} className={cn('flex w-full gap-2 rounded-md px-3 py-2 text-left text-sm', m.id === mode ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')}>
                <m.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span><span className="font-medium">{m.label}</span><span className="block text-xs text-muted-foreground">{m.hint}</span></span>
              </button>
            ))}
          </CardContent></Card>
          {mode === 'guided_gap' && summary && (
            <Card><CardContent className="space-y-2 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Argomento</div>
              <select className="w-full rounded-md border bg-card px-2 py-2 text-sm" value={topic?.id ?? ''} onChange={(e) => setParam('topic', e.target.value)}>
                <option value="">Scegli…</option>
                {summary.readiness.items.map((i) => <option key={i.topic.id} value={i.topic.id}>{i.topic.name} ({Math.round(i.score)})</option>)}
              </select>
            </CardContent></Card>
          )}
        </div>

        <Card className="flex h-[calc(100vh-14rem)] min-h-[480px] flex-col lg:col-span-3">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-3 h-10 w-10 text-primary" />
                <div className="font-medium">{topic && mode === 'guided_gap' ? `Sessione guidata su ${topic.name}` : `Chiedimi qualcosa su ${summary?.course.name ?? 'un corso'}`}</div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {starters.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>{s}</Button>)}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-lg px-4 py-3 text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <RichText text={m.content || '…'} />
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                      {m.citations.map((c, k) => <Badge key={k} variant="outline" className="bg-card font-normal"><FileText className="h-3 w-3" /> {c.title}, p. {c.page}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Scrivi la tua domanda…" className="min-h-[44px] resize-none" rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={busy || !input.trim()}><Send /></Button>
          </form>
        </Card>
      </div>
    </>
  );
}
