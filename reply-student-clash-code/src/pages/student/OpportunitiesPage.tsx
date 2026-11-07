import { useState } from 'react';
import { Briefcase, CalendarDays, MapPin, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useOpportunities, useOpportunityFeedback } from '@/data/hooks';
import type { OpportunityKind } from '@/types/database';
import { PageHeader, LoadingBlock } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

const KIND_LABEL: Record<OpportunityKind, string> = { internship: 'Tirocinio', job: 'Lavoro', event: 'Evento', scholarship: 'Borsa di studio' };

export function OpportunitiesPage() {
  const user = useCurrentUser();
  const { data, isLoading } = useOpportunities(user.id);
  const fb = useOpportunityFeedback(user.id);
  const [kind, setKind] = useState<OpportunityKind | 'all'>('all');
  const list = data?.filter((o) => kind === 'all' || o.kind === kind);

  return (
    <>
      <PageHeader title="Opportunità" description="Tirocini, lavoro, eventi e borse selezionati in base al tuo profilo, con il motivo del suggerimento." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'internship', 'job', 'event', 'scholarship'] as const).map((k) => (
          <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} onClick={() => setKind(k)}>{k === 'all' ? 'Tutte' : KIND_LABEL[k]}</Button>
        ))}
      </div>
      {isLoading ? <LoadingBlock /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list?.map((o) => (
            <Card key={o.id} className={cn(o.feedback === 'not_interested' && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent"><Briefcase className="h-5 w-5 text-accent-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{o.title}</div>
                    <div className="text-sm text-muted-foreground">{o.organization}</div>
                  </div>
                  <Badge variant={o.score >= 0.7 ? 'mastered' : o.score >= 0.4 ? 'consolidating' : 'unverified'}>{Math.round(o.score * 100)}%</Badge>
                </div>
                <p className="mt-3 text-sm">{o.description}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <Badge variant="secondary">{KIND_LABEL[o.kind]}</Badge>
                  {o.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.location}</span>}
                  {o.deadline && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Scadenza {fmtDate(o.deadline)}</span>}
                </div>
                {o.reasons.length > 0 && (
                  <ul className="mt-3 space-y-0.5 rounded-md bg-muted/60 p-2.5 text-xs">
                    {o.reasons.map((r) => <li key={r}>• {r}</li>)}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant={o.feedback === 'interested' ? 'default' : 'outline'} onClick={() => fb.mutate({ id: o.id, feedback: 'interested' })}><ThumbsUp /> Interessante</Button>
                  <Button size="sm" variant={o.feedback === 'not_interested' ? 'secondary' : 'ghost'} onClick={() => fb.mutate({ id: o.id, feedback: 'not_interested' })}><ThumbsDown /> Non mi interessa</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
