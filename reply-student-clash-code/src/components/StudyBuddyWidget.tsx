import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  X,
  BookOpen,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { useCurrentUser } from '@/app/AuthContext';
import { useStudentCourses, useStudyBuddies } from '@/data/hooks';
import type { StudyBuddyMatch } from '@/lib/matchmaking';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StudyBuddyWidget() {
  const user = useCurrentUser();
  const { data: courses, isLoading: loadingCourses } = useStudentCourses(user.id);

  // Corso selezionato: default al primo (prossimo appello)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const activeCourseId = selectedCourseId ?? courses?.[0]?.course.id;
  const activeCourse = courses?.find((c) => c.course.id === activeCourseId) ?? courses?.[0];

  const { data: buddies, isLoading: loadingBuddies } = useStudyBuddies(user.id, activeCourseId);

  // Stato degli inviti inviati per peerId
  const [invitedPeerIds, setInvitedPeerIds] = useState<Record<string, { date: string; location: string }>>({});
  const [modalBuddy, setModalBuddy] = useState<StudyBuddyMatch | null>(null);

  // Form stato nel modale
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [studyLocation, setStudyLocation] = useState<'biblioteca' | 'aule' | 'online'>('biblioteca');
  const [studyWhen, setStudyWhen] = useState<'domani' | 'giovedi' | 'weekend'>('domani');
  const [customNote, setCustomNote] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleOpenInvite = (buddy: StudyBuddyMatch) => {
    setModalBuddy(buddy);
    // Pre-seleziona i topic complementari
    const defaultTopics = [
      ...buddy.theyHelpYou.map((t) => t.topicName),
      ...buddy.youHelpThem.map((t) => t.topicName),
    ];
    setSelectedTopics(defaultTopics);
    setCustomNote(
      `Ciao ${buddy.peer.fullName.split(' ')[0]}, ti andrebbe di ripassare insieme ${buddy.courseName}? Possiamo confrontarci su ${defaultTopics.slice(0, 2).join(' e ')}!`,
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

    setInvitedPeerIds((prev) => ({
      ...prev,
      [modalBuddy.peer.id]: {
        date: whenMap[studyWhen],
        location: locationMap[studyLocation],
      },
    }));

    const peerName = modalBuddy.peer.fullName;
    setFeedbackNotice(`Invito inviato a ${peerName}! Abbiamo proposto una sessione su ${modalBuddy.courseName}.`);
    setModalBuddy(null);

    // Rimuovi notice dopo 6 secondi
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 6000);
  };

  if (loadingCourses) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="mt-8">
      <Card className="border-border/80 shadow-sm transition-all">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Compagni di studio per il prossimo esame
                </CardTitle>
                <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/5 text-primary text-[11px]">
                  <Sparkles className="h-3 w-3" /> Matchmaking P2P
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Algoritmo basato sulla <strong className="text-foreground">complementarità dei mastery</strong>: trovi colleghi con cui colmare lacune reciproche.
              </CardDescription>
            </div>

            {/* Switch corso se più di uno */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {courses && courses.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Corso:</span>
                  {courses.map((c) => {
                    const isSelected = (activeCourseId ?? courses[0].course.id) === c.course.id;
                    return (
                      <button
                        key={c.course.id}
                        onClick={() => setSelectedCourseId(c.course.id)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                        )}
                      >
                        {c.course.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1" asChild>
                <Link to="/student/study-group">
                  Tutti i gruppi <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Toast feedback notifica invio */}
          {feedbackNotice && (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{feedbackNotice}</span>
              </div>
              <button
                onClick={() => setFeedbackNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {loadingBuddies ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-36 w-full rounded-lg" />
            </div>
          ) : !buddies || buddies.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nessun compagno trovato per questo corso al momento. I suggerimenti si aggiornano man mano che la classe completa i checkpoint.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buddies.map((buddy) => {
                const isInvited = Boolean(invitedPeerIds[buddy.peer.id]);
                const inviteData = invitedPeerIds[buddy.peer.id];

                return (
                  <div
                    key={buddy.peer.id}
                    className="flex flex-col justify-between rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div>
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {initials(buddy.peer.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm leading-tight truncate">
                              {buddy.peer.fullName}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {buddy.peer.degreeProgram} · {buddy.peer.year}° anno
                            </div>
                          </div>
                        </div>

                        {/* Match badge */}
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {buddy.matchScore}% match
                        </span>
                      </div>

                      {/* Complementarità Pillole */}
                      <div className="mt-3.5 space-y-2 text-xs">
                        {buddy.theyHelpYou.length > 0 && (
                          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-950 dark:text-emerald-200 border border-emerald-500/20">
                            <div className="flex items-center gap-1 font-semibold text-[11px] text-emerald-700 dark:text-emerald-300">
                              <span className="text-emerald-600 font-bold">↑</span> Può aiutarti su:
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {buddy.theyHelpYou.map((t) => (
                                <span
                                  key={t.topicId}
                                  className="inline-flex items-center rounded-md bg-background/80 px-1.5 py-0.5 font-medium text-[11px] text-foreground border border-border/40"
                                >
                                  {t.topicName} <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">{t.peerScore}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {buddy.youHelpThem.length > 0 && (
                          <div className="rounded-lg bg-primary/10 p-2 text-primary-950 dark:text-primary-200 border border-primary/20">
                            <div className="flex items-center gap-1 font-semibold text-[11px] text-primary">
                              <span className="text-primary font-bold">↓</span> Puoi aiutarlo su:
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {buddy.youHelpThem.map((t) => (
                                <span
                                  key={t.topicId}
                                  className="inline-flex items-center rounded-md bg-background/80 px-1.5 py-0.5 font-medium text-[11px] text-foreground border border-border/40"
                                >
                                  {t.topicName} <span className="ml-1 text-primary font-semibold">{t.yourScore}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Frase di sintesi AI */}
                      <p className="mt-3 text-xs text-muted-foreground italic leading-snug">
                        «{buddy.summary}»
                      </p>
                    </div>

                    {/* Footer con disponibilità e azione */}
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{buddy.availability}</span>
                      </div>

                      {isInvited ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Invito inviato ({inviteData.location})</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenInvite(buddy)}
                          className="w-full gap-1.5 text-xs hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Send className="h-3 w-3" />
                          Proponi sessione di studio
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal di proposta studio */}
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
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm">
              {/* Argomenti di scambio */}
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Argomenti di focus (scambio reciproco):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[...modalBuddy.theyHelpYou, ...modalBuddy.youHelpThem].map((topic) => {
                    const isSelected = selectedTopics.includes(topic.topicName);
                    return (
                      <button
                        key={topic.topicId}
                        type="button"
                        onClick={() => {
                          setSelectedTopics((prev) =>
                            isSelected ? prev.filter((t) => t !== topic.topicName) : [...prev, topic.topicName],
                          );
                        }}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-medium border transition-colors',
                          isSelected
                            ? 'bg-primary/15 border-primary text-primary font-semibold'
                            : 'bg-muted border-transparent text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {isSelected ? '✓ ' : '+ '} {topic.topicName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dove studiare */}
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Modalità / Luogo:
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

              {/* Messaggio personalizzato */}
              <div>
                <label className="font-medium text-foreground block mb-1.5 flex items-center justify-between">
                  <span>Messaggio di invito:</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Modificabile</span>
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
    </section>
  );
}
