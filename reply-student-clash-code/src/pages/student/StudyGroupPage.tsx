import { CalendarClock, Users } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useStudentCourses, useStudyGroup } from '@/data/hooks';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BandBadge, MasteryBar, BandLegend } from '@/components/mastery';
import { bandOf } from '@/lib/mastery';

const SLOT_LABEL: Record<string, string> = { lun_pom: 'Lun pomeriggio', mar_mat: 'Mar mattina', mer_pom: 'Mer pomeriggio', gio_mat: 'Gio mattina', ven_pom: 'Ven pomeriggio', sab_mat: 'Sab mattina' };

export function StudyGroupPage() {
  const user = useCurrentUser();
  const { data: courses } = useStudentCourses(user.id);
  const ro = courses?.[0];
  const { data, isLoading } = useStudyGroup(user.id, ro?.course.id);
  const topicName = (id: string | null) => data?.topics.find((t) => t.id === id)?.name ?? '—';
  const myMastery = new Map(ro?.mastery.map((m) => [m.topic_id, m.score]));

  return (
    <>
      <PageHeader title="Gruppo di studio" description={`${ro?.course.name ?? ''} · formato dall'algoritmo di matchmaking: chi è forte su un argomento copre le lacune degli altri.`} />
      {isLoading || !data ? <LoadingBlock rows={2} /> : !data.group ? <EmptyState icon={Users} title="Nessun gruppo" description="Iscriviti al matchmaking per essere abbinato." /> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Membri e ruoli</CardTitle><CardDescription>Copertura complessiva {Math.round(data.group.coverageScore)}/100</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {data.group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar><AvatarFallback>{initials(m.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{m.name}{m.id === user.id && ' (tu)'}</div>
                    <div className="text-xs text-muted-foreground">Riferimento per: {topicName(m.roleTopicId)}</div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                {data.group.sharedSlots.length ? data.group.sharedSlots.map((s) => <Badge key={s} variant="secondary">{SLOT_LABEL[s] ?? s}</Badge>) : <span className="text-muted-foreground">Nessuno slot comune</span>}
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="gap-2 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div><CardTitle>Mappa di copertura</CardTitle><CardDescription>Il livello migliore del gruppo per ogni argomento, confrontato con il tuo</CardDescription></div>
              <BandLegend />
            </CardHeader>
            <CardContent className="space-y-4">
              {data.topics.map((t) => {
                const cov = data.group!.coverage[t.id] ?? 0;
                const mine = myMastery.get(t.id) ?? 0;
                return (
                  <div key={t.id}>
                    <div className="mb-1 flex items-center gap-2 text-sm">
                      <span className="flex-1">{t.name}</span>
                      <span className="text-xs text-muted-foreground">tu {Math.round(mine)} · gruppo {Math.round(cov)}</span>
                      <BandBadge band={bandOf(cov, 1)} />
                    </div>
                    <MasteryBar score={cov} band={bandOf(cov, 1)} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
