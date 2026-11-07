import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Presentation } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useAuth } from '@/app/AuthContext';
import { useDemoUsers } from '@/data/hooks';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function LoginPage() {
  const { data: users, isLoading } = useDemoUsers();
  const { login } = useAuth();
  const navigate = useNavigate();

  const enter = async (id: string) => {
    const p = await login(id);
    if (p) navigate(p.role === 'teacher' ? '/teacher' : '/student');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent via-background to-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 max-w-sm text-muted-foreground">{APP_CONFIG.tagline}</p>
        </div>
        <Card className="p-6">
          <h1 className="text-lg font-semibold">Accesso demo</h1>
          <p className="mb-5 text-sm text-muted-foreground">{APP_CONFIG.tenantName} · scegli un profilo, nessuna password richiesta.</p>
          <div className="grid gap-3">
            {isLoading && <><Skeleton className="h-16" /><Skeleton className="h-16" /></>}
            {users?.map((u) => (
              <button
                key={u.profile.id}
                onClick={() => enter(u.profile.id)}
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
              >
                <Avatar className="h-11 w-11"><AvatarFallback>{initials(u.profile.full_name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    {u.profile.full_name}
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {u.profile.role === 'teacher' ? <Presentation className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                      {u.profile.role === 'teacher' ? 'Docente' : 'Studente'}
                    </span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{u.subtitle}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">Prototipo · dati simulati · {APP_CONFIG.name} è un nome segnaposto</p>
      </div>
    </div>
  );
}
