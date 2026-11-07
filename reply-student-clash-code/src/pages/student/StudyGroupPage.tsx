import { useState } from 'react';
import {
  Users,
  Sparkles,
  ArrowRightLeft,
  CalendarDays,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useStudentCourses, useStudyBuddies } from '@/data/hooks';
import type { StudyBuddyMatch } from '@/lib/matchmaking';
import { PageHeader, LoadingBlock, StatCard } from '@/components/common';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StudyGroupPage() {
  const user = useCurrentUser();
  const { data: courses } = useStudentCourses(user.id);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const activeCourseId = selectedCourseId ?? courses?.[0]?.course.id;
  const activeCourse = courses?.find((c) => c.course.id === activeCourseId) ?? courses?.[0];

  const { data: buddies, isLoading: loadingBuddies } = useStudyBuddies(user.id, activeCourseId);

  // Filtro per topic
  const [filterTopic, setFilterTopic] = useState<string | null>(null);

  // Inviti inviati
  const [invitedBuddies, setInvitedBuddies] = useState<
    Record<string, { peerName: string; courseName: string; when: string; location: string }>
  >({
    'sample-1': {
      peerName: 'Sara Colombo',
      courseName: 'Ricerca Operativa',
      when: 'Mercoledì 11 Nov · ore 15:00',
      location: 'Biblioteca centrale (Tavolo 4)',
    },
  });

  const [modalBuddy, setModalBuddy] = useState<StudyBuddyMatch | null>(null);
  const [studyLocation, setStudyLocation] = useState<'biblioteca' | 'aule' | 'online'>('biblioteca');
  const [studyWhen, setStudyWhen] = useState<'domani' | 'giovedi' | 'weekend'>('domani');
  const [customNote, setCustomNote] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleOpenInvite = (buddy: StudyBuddyMatch) => {
    setModalBuddy(buddy);
    const topics = [
      ...buddy.theyHelpYou.map((t) => t.topicName),
      ...buddy.youHelpThem.map((t) => t.topicName),
    ];
    setCustomNote(
      `Ciao ${buddy.peer.fullName.split(' ')[0]}, ti andrebbe di ripassare insieme ${buddy.courseName}? Possiamo confrontarci su ${topics.slice(0, 2).join(' e ')}!`,
    );
  };

  const handleSendInvite = () => {
    if (!modalBuddy) return;
    const locationMap = {
      biblioteca: 'Biblioteca centrale',
      aule: 'Aule studio Ingegneria',
      online: 'Online (Teams)',
    };
    const whenMap = {
      domani: 'Domani ore 16:30',
      giovedi: 'Giovedì ore 15:00',
      weekend: 'Sabato mattina',
    };

    setInvitedBuddies((prev) => ({
      ...prev,
      [modalBuddy.peer.id]: {
        peerName: modalBuddy.peer.fullName,
        courseName: modalBuddy.courseName,
        when: whenMap[studyWhen],
        location: locationMap[studyLocation],
      },
    }));

    setFeedbackNotice(`Proposta inviata a ${modalBuddy.peer.fullName} con successo!`);
    setModalBuddy(null);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const filteredBuddies = buddies?.filter((b) => {
    if (!filterTopic) return true;
    return (
      b.theyHelpYou.some((t) => t.topicName === filterTopic) ||
      b.youHelpThem.some((t) => t.topicName === filterTopic)
    );
  });

  return (
    <>
      <PageHeader
        eyebrow="Apprendimento cooperativo peer-to-peer"
        title="Gruppi di studio & Matchmaking"
        description="L'algoritmo di A.T.L.A.S mappa i livelli di competenza della classe e ti propone i compagni ideali: chi ha padronanza dei tuoi punti deboli e riceve il tuo aiuto dove tu eccelli."
      />

      {/* KPI Riassuntivi */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Materia attiva"
          icon={BookOpen}
          value={activeCourse ? activeCourse.course.code : '—'}
          hint={activeCourse?.course.name}
        />
        <StatCard
          label="Sinergia media"
          icon={Sparkles}
          value="92%"
          hint="Complementarità di competenze"
          tone="good"
        />
        <StatCard
          label="Compagni disponibili"
          icon={Users}
          value={buddies ? `${buddies.length + 8}` : '—'}
          hint="Iscritti al corso attivi"
        />
        <StatCard
          label="Sessioni programmate"
          icon={CalendarDays}
          value={Object.keys(invitedBuddies).length}
          hint="Inviti confermati o inviati"
        />
      </div>

      {/* Sessioni già programmate / Inviti attivi */}
      {Object.keys(invitedBuddies).length > 0 && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Le tue sessioni di studio in programma
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(invitedBuddies).map(([id, sess]) => (
                <div key={id} className="flex items-center justify-between rounded-lg border bg-background p-3 text-xs shadow-2xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{sess.peerName} · <span className="font-normal text-muted-foreground">{sess.courseName}</span></div>
                    <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sess.when}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {sess.location}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent">
                    Confermato
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selettore corso e filtri */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Corso di studio:</span>
          {courses?.map((c) => {
            const isSelected = (activeCourseId ?? courses[0].course.id) === c.course.id;
            return (
              <button
                key={c.course.id}
                onClick={() => {
                  setSelectedCourseId(c.course.id);
                  setFilterTopic(null);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {c.course.name} ({c.course.cfu} CFU)
              </button>
            );
          })}
        </div>

        {/* Filtro per argomento */}
        {activeCourse && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterTopic ?? ''}
              onChange={(e) => setFilterTopic(e.target.value || null)}
              className="rounded-lg border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Tutti gli argomenti di scambio</option>
              {activeCourse.topics.map((t) => (
                <option key={t.id} value={t.name}>
                  Focus: {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {feedbackNotice && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{feedbackNotice}</span>
          </div>
        </div>
      )}

      {/* Lista compagni consigliati */}
      {loadingBuddies ? (
        <LoadingBlock rows={3} />
      ) : !filteredBuddies || filteredBuddies.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nessun compagno trovato con i filtri selezionati. Prova a selezionare un altro argomento o materia.
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredBuddies.map((buddy) => {
            const isInvited = Boolean(invitedBuddies[buddy.peer.id]);
            const inviteData = invitedBuddies[buddy.peer.id];

            return (
              <Card
                key={buddy.peer.id}
                className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-11 w-11 border">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {initials(buddy.peer.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-base leading-tight truncate">
                          {buddy.peer.fullName}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {buddy.peer.degreeProgram} · {buddy.peer.year}° anno
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      {buddy.matchScore}% match
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 flex-1">
                  {/* Blocco Scambio Competenze */}
                  <div className="space-y-2">
                    {buddy.theyHelpYou.length > 0 && (
                      <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs border border-emerald-500/20">
                        <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 text-[11px]">
                          <span>↑</span> Può aiutarti su:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {buddy.theyHelpYou.map((t) => (
                            <span
                              key={t.topicId}
                              className="inline-flex items-center rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium border border-border/50 text-foreground"
                            >
                              {t.topicName} <strong className="ml-1 text-emerald-600 dark:text-emerald-400">{t.peerScore}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {buddy.youHelpThem.length > 0 && (
                      <div className="rounded-lg bg-primary/10 p-2.5 text-xs border border-primary/20">
                        <div className="font-semibold text-primary flex items-center gap-1 text-[11px]">
                          <span>↓</span> Puoi aiutarlo su:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {buddy.youHelpThem.map((t) => (
                            <span
                              key={t.topicId}
                              className="inline-flex items-center rounded-md bg-background/90 px-1.5 py-0.5 text-[11px] font-medium border border-border/50 text-foreground"
                            >
                              {t.topicName} <strong className="ml-1 text-primary">{t.yourScore}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Motivazione algoritmo */}
                  <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground italic leading-relaxed">
                    «{buddy.summary}»
                  </div>

                  {/* Preferenza studio */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{buddy.availability}</span>
                  </div>

                  <div className="pt-2">
                    {isInvited ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Invito inviato ({inviteData.location})</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenInvite(buddy)}
                        className="w-full gap-1.5 text-xs font-medium"
                      >
                        <Send className="h-3.5 w-3.5" /> Proponi sessione di studio
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modale invio proposta */}
      {modalBuddy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials(modalBuddy.peer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base leading-tight">
                    Proponi sessione a {modalBuddy.peer.fullName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Per preparare {modalBuddy.courseName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalBuddy(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              {/* Dove */}
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Modalità / Luogo dell'incontro:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'biblioteca', label: 'Biblioteca centrale', icon: BookOpen },
                    { id: 'aule', label: 'Aule studio', icon: GraduationCap },
                    { id: 'online', label: 'Online (Teams)', icon: ArrowRightLeft },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setStudyLocation(loc.id as any)}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all',
                        studyLocation === loc.id
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-card text-muted-foreground hover:border-border/80',
                      )}
                    >
                      <loc.icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{loc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quando */}
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Quando proporre l'incontro:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'domani', label: 'Domani (16:30)' },
                    { id: 'giovedi', label: 'Giovedì (15:00)' },
                    { id: 'weekend', label: 'Weekend' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setStudyWhen(w.id as any)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs text-center transition-all',
                        studyWhen === w.id
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-border/80',
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messaggio */}
              <div>
                <label className="font-medium text-foreground block mb-1.5 flex items-center justify-between">
                  <span>Messaggio:</span>
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setModalBuddy(null)}>
                Annulla
              </Button>
              <Button size="sm" onClick={handleSendInvite} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Invia proposta a {modalBuddy.peer.fullName.split(' ')[0]}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

