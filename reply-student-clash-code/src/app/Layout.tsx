import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Bell } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { useAuth, useCurrentUser } from './AuthContext';
import { STUDENT_NAV, TEACHER_NAV, type NavItem } from './nav';
import { Avatar, AvatarFallback, initials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useNotifications } from '@/data/hooks';
import { cn } from '@/lib/utils';

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  let lastSection: string | undefined;
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((it) => {
        const header = it.section && it.section !== lastSection ? it.section : null;
        lastSection = it.section;
        return (
          <div key={it.to}>
            {header && <div className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{header}</div>}
            <NavLink
              to={it.to}
              end={it.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-sidebar-accent text-accent-foreground' : 'text-sidebar-foreground hover:bg-muted',
                )
              }
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </NavLink>
          </div>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = user.role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const { data: notifications } = useNotifications(user.id);
  const unread = notifications?.filter((n) => !n.read_at).length ?? 0;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavList items={items} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <Avatar><AvatarFallback>{initials(user.full_name)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.full_name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.role === 'teacher' ? 'Docente' : user.degree_program}</div>
          </div>
          <Button variant="ghost" size="icon" title="Esci" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">{sidebar}</aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r bg-sidebar shadow-xl">
            <Button variant="ghost" size="icon" className="absolute right-2 top-3" onClick={() => setOpen(false)}><X /></Button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></Button>
          <div className="text-sm text-muted-foreground">{APP_CONFIG.tenantName}</div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" title="Notifiche">
              <Bell />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-band-gap" />}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
