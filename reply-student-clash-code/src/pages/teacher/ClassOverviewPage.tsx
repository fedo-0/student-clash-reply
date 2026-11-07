import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CalendarCheck, Gauge, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCurrentUser } from '@/app/AuthContext';
import { useCourseAggregates, useTeacherCourses } from '@/data/hooks';
import { CourseTabs, useSelectedCourse } from '@/components/CourseSelect';
import { PageHeader, LoadingBlock, StatCard } from '@/components/common';
import { BAND_BG, BandLegend, readinessBand, BAND_FILL, TrendBadge } from '@/components/mastery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BAND_LABEL, type Band } from '@/lib/mastery';
import { trendOf } from '@/lib/readiness';
import { cn } from '@/lib/utils';

const BANDS: Band[] = ['gap', 'consolidating', 'mastered', 'unverified'];
const tooltipStyle = { borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: 12 };
const axisTick = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

export function ClassOverviewPage() {
  const user = useCurrentUser();
  const { data: courses } = useTeacherCourses(user.id);
  const { courseId, select } = useSelectedCourse(courses);
  const { data: ag, isLoading } = useCourseAggregates(courseId);

  return (
    <>
      <PageHeader
        title="Overview classe"
        description="Distribuzione della preparazione per argomento. Vedi solo dati aggregati e anonimi."
        actions={courses && <CourseTabs courses={courses} value={courseId} onChange={select} />}
      />
      {isLoading || !ag ? <LoadingBlock rows={4} /> : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Studenti iscritti" value={ag.studentsCount} icon={Users} />
            <StatCard label="Attivi ultimi 7 giorni" value={`${ag.activeStudents7d}`} hint={`${Math.round((ag.activeStudents7d / ag.studentsCount) * 100)}% della classe`} icon={Activity} />
            <StatCard label="Readiness media" value={`${Math.round(ag.avgReadiness)}%`} hint={<TrendBadge delta={trendOf(ag.readinessTrend, 2)} period="in 2 settimane" />} icon={Gauge} />
            <StatCard label="Sotto il 40%" value={ag.atRiskCount} hint="studenti a rischio (anonimi)" icon={AlertTriangle} tone={ag.atRiskCount > 0 ? 'bad' : 'default'} />
          </div>

          {/* Heatmap */}
          <Card className="mb-6">
            <CardHeader className="gap-2 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle>Heatmap argomenti × fasce</CardTitle>
                <CardDescription>Quanti studenti si trovano in ogni fascia, per argomento</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild><Link to={`/teacher/checkpoint?course=${ag.course.id}`}><CalendarCheck /> Suggerimenti per la lezione</Link></Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="w-[34%] text-left font-medium">Argomento</th>
                    <th className="font-medium">Peso</th>
                    {BANDS.map((b) => <th key={b} className="font-medium">{BAND_LABEL[b]}</th>)}
                    <th className="font-medium">Media</th>
                  </tr>
                </thead>
                <tbody>
                  {ag.distributions.map((d) => (
                    <tr key={d.topicId}>
                      <td className="pr-2">
                        <div className="font-medium">{d.topicName}</div>
                        <div className="text-xs text-muted-foreground">{d.module}</div>
                      </td>
                      <td className="text-center tabular-nums text-muted-foreground">{Math.round(d.examWeight * 100)}%</td>
                      {BANDS.map((b) => {
                        const share = d.counts[b] / ag.studentsCount;
                        return (
                          <td key={b} className="relative h-12 overflow-hidden rounded-md bg-muted/40 text-center">
                            <div className={cn('absolute inset-0', BAND_BG[b])} style={{ opacity: share * 0.9 }} />
                            <span className={cn('relative tabular-nums', share > 0.45 ? 'font-semibold text-white' : 'text-foreground')}>
                              {d.counts[b]} <span className="text-[10px] opacity-80">({Math.round(share * 100)}%)</span>
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center font-semibold tabular-nums">{Math.round(d.avgScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <BandLegend className="mt-3" />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Distribuzione readiness</CardTitle><CardDescription>Numero di studenti per fascia di readiness all'esame</CardDescription></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ag.readinessHistogram} margin={{ left: -20, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="range" tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Studenti']} labelFormatter={(l) => `Readiness ${l}%`} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {ag.readinessHistogram.map((b) => <Cell key={b.range} fill={BAND_FILL[readinessBand(b.from + 5)]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Trend settimanale</CardTitle><CardDescription>Readiness media della classe a fine settimana</CardDescription></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ag.readinessTrend} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${Math.round(v)}%`, 'Readiness media']} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Engagement</CardTitle><CardDescription>Attività registrate (quiz, tutor, simulazioni) e studenti attivi per settimana</CardDescription></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ag.engagement} margin={{ left: -20, right: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="l" dataKey="events" name="Attività" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="r" dataKey="activeStudents" name="Studenti attivi" stroke="hsl(var(--chart-3))" strokeWidth={2.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
