import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useGenerateExamMatch, useStudentExamPostings } from '@/data/hooks';
import { PageHeader, LoadingBlock, EmptyState } from '@/components/common';
import { ExamPostingCard, ExamPostingDetail } from '@/components/exams/ExamPosting';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Sezione Esami: gli esami da sostenere presentati come annunci di lavoro.
 * Lista a sinistra, annuncio selezionato a destra (su mobile: una vista alla volta).
 */
export function ExamsPage() {
  const user = useCurrentUser();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: views, isLoading } = useStudentExamPostings(user.id);
  const generate = useGenerateExamMatch(user.id, user.full_name);

  const selected = views?.find((v) => v.course.id === courseId) ?? null;
  // su desktop, senza selezione apri il primo annuncio
  useEffect(() => {
    if (!courseId && views?.length && window.matchMedia('(min-width: 1024px)').matches) navigate(`/student/exams/${views[0].course.id}`, { replace: true });
  }, [courseId, views, navigate]);

  const withMatch = views?.filter((v) => v.match).length ?? 0;
  const generatingThis = generate.isPending && generate.variables?.posting.id === selected?.posting.id;

  return (
    <>
      <PageHeader
        title="Esami"
        description="I tuoi esami da sostenere, come annunci: requisiti, competenze e prove passate pubblicate dai docenti. Fatti dire dall'AI quanto il tuo profilo corrisponde."
      />
      {isLoading || !views ? <LoadingBlock rows={3} /> : views.length === 0 ? (
        <EmptyState icon={Briefcase} title="Nessun esame da sostenere" description="Quando un docente pubblica l'annuncio di un tuo esame lo trovi qui." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className={cn(selected && 'hidden lg:block')}>
            <Card className="overflow-hidden lg:sticky lg:top-20">
              <div className="border-b px-4 py-3">
                <div className="font-semibold">Da sostenere · {views.length}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" /> Corrispondenza generata per {withMatch} su {views.length}</div>
              </div>
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
                {views.map((v) => (
                  <ExamPostingCard key={v.posting.id} view={v} active={v.course.id === courseId} onClick={() => navigate(`/student/exams/${v.course.id}`)} />
                ))}
              </div>
            </Card>
          </div>

          <div className={cn(!selected && 'hidden lg:block')}>
            {selected ? (
              <>
                <Button variant="ghost" size="sm" className="-ml-2 mb-2 lg:hidden" asChild><Link to="/student/exams"><ArrowLeft /> Tutti gli esami</Link></Button>
                <ExamPostingDetail
                  key={selected.posting.id}
                  view={selected}
                  teacher={selected.teacher}
                  onGenerate={() => generate.mutate(selected)}
                  generating={generatingThis}
                />
              </>
            ) : <LoadingBlock rows={2} />}
          </div>
        </div>
      )}
    </>
  );
}
