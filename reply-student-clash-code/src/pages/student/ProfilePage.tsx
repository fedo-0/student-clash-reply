import { useState } from 'react';
import { FileUp, FolderGit2, Loader2, Sparkles } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useCurrentUser } from '@/app/AuthContext';
import { useExamRecords, useStudentCourses, useStudentProjects, useStudentSkills } from '@/data/hooks';
import { ai } from '@/ai/client';
import { PageHeader, StatCard, LoadingBlock } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { earnedCfu, weightedAverage } from '@/lib/grades';
import { fmt } from '@/lib/utils';

export function ProfilePage() {
  const user = useCurrentUser();
  const { data: records } = useExamRecords(user.id);
  const { data: courses } = useStudentCourses(user.id);
  const { data: skills } = useStudentSkills(user.id);
  const { data: projects } = useStudentProjects(user.id);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<{ name: string; level: number }[] | null>(null);

  const radar = courses?.flatMap((c) => c.readiness.items.map((i) => ({ topic: i.topic.name.length > 18 ? `${i.topic.name.slice(0, 16)}…` : i.topic.name, score: Math.round(i.score), course: c.course.name }))) ?? [];
  const all = courses?.flatMap((c) => c.readiness.items) ?? [];
  const strengths = all.filter((i) => i.band === 'mastered').sort((a, b) => b.score - a.score).slice(0, 4);
  const gaps = all.filter((i) => i.band === 'gap' || !i.practiced).sort((a, b) => a.score - b.score).slice(0, 4);

  const uploadCv = async () => { setExtracting(true); setExtracted(await ai.extractCvSkills('cv.pdf')); setExtracting(false); };

  return (
    <>
      <PageHeader title="Profilo competenze" description={`${user.degree_program} · ${user.year}° anno · matricola ${user.external_id}`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Esami sostenuti" value={records?.filter((r) => r.passed_at).length ?? '—'} />
        <StatCard label="Media ponderata" value={records ? fmt(weightedAverage(records), 2) : '—'} />
        <StatCard label="CFU" value={records ? earnedCfu(records) : '—'} />
        <StatCard label="Skill nel profilo" value={skills?.length ?? '—'} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Radar delle competenze</CardTitle><CardDescription>Livello per argomento nei corsi in cui sei iscritta</CardDescription></CardHeader>
          <CardContent className="h-96">
            {!courses ? <LoadingBlock rows={1} /> : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Radar dataKey="score" name="Livello" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Sintesi</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><div className="mb-1.5 font-medium">Punti di forza</div><div className="flex flex-wrap gap-1.5">{strengths.map((s) => <Badge key={s.topic.id} variant="mastered">{s.topic.name}</Badge>)}</div></div>
            <div><div className="mb-1.5 font-medium">Da colmare</div><div className="flex flex-wrap gap-1.5">{gaps.map((s) => <Badge key={s.topic.id} variant={s.practiced ? 'gap' : 'unverified'}>{s.topic.name}</Badge>)}</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Skill</CardTitle><CardDescription>Dichiarate, estratte dal CV o dai progetti</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">{skills?.map((s) => <Badge key={s.id} variant="secondary">{s.name} {'●'.repeat(s.level ?? 0)}</Badge>)}</div>
            <Button variant="outline" className="w-full" onClick={uploadCv} disabled={extracting}>{extracting ? <Loader2 className="animate-spin" /> : <FileUp />} Carica CV (PDF)</Button>
            {extracted && <div className="rounded-md bg-accent/60 p-3 text-xs"><div className="mb-1 font-medium">L'AI ha estratto dal CV:</div>{extracted.map((s) => s.name).join(', ')}</div>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Progetti</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {projects?.map((p) => (
              <div key={p.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2 text-sm font-medium"><FolderGit2 className="h-4 w-4 text-muted-foreground" /> {p.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">{p.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
