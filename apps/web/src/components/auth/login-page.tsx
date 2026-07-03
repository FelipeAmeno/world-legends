'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';

export function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simula auth
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-widest">WORLD LEGENDS</h1>
          <p className="text-sm text-muted-foreground">O jogo de cartas de futebol histórico.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">E-mail</label>
                <Input type="email" placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Senha</label>
                <Input type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Não tem uma conta? <Link href="/register" className="text-primary hover:underline">Criar conta</Link></p>
          <p><Link href="#" className="text-xs hover:underline">Esqueci minha senha</Link></p>
        </div>
      </div>
    </div>
  );
}
