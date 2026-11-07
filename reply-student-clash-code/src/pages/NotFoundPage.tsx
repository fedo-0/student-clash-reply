import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl font-semibold">404</div>
      <p className="text-muted-foreground">Pagina non trovata.</p>
      <Button asChild><Link to="/">Torna alla home</Link></Button>
    </div>
  );
}
