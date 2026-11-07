/** Login demo: nessuna password, si sceglie un utente. L'utente corrente vive in questo context. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from '@/types/database';
import { api } from '@/data/api';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  login: (userId: string) => Promise<Profile | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = 'demo-user-id';

const storage = {
  get: () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
  set: (v: string) => { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = storage.get();
    if (!saved) return setLoading(false);
    api.getProfile(saved).then((p) => { setUser(p); setLoading(false); });
  }, []);

  const login = async (userId: string) => {
    const p = await api.getProfile(userId);
    setUser(p);
    if (p) storage.set(p.id);
    return p;
  };
  const logout = () => { storage.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuori da AuthProvider');
  return ctx;
}

/** Utente corrente garantito (da usare dentro le route protette). */
export function useCurrentUser(): Profile {
  const { user } = useAuth();
  if (!user) throw new Error('Nessun utente loggato');
  return user;
}
