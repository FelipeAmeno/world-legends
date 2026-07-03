'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';

export function RegisterPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Star className="mx-auto h-8 w-8 text-primary" />
          <h1 className="text-2xl font-black tracking-widest">WORLD LEGENDS</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta e comece a colecionar.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Username</label>
                <Input placeholder="lenda_do_br" required pattern="[a-z0-9_]+" />
                <p className="text-[10px] text-muted-foreground">Apenas letras, números e _</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">E-mail</label>
                <Input type="email" placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Senha</label>
                <Input type="password" placeholder="Mínimo 8 caracteres" minLength={8} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta? <Link href="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
