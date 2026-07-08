'use client';

/**
 * components/ui/PremiumToast.tsx — Sprint 19 (Game Feel & Immersion)
 *
 * `components/ui/WLToast.tsx` (+ `lib/wl-toast.ts`) já é o sistema de toast
 * próprio do jogo desde a Sprint 3 — nunca foi o toast padrão de nenhuma
 * lib, tem spring animation, shimmer, barra de progresso e tema por tipo.
 * Sprint 19 estendeu os tipos com os que faltavam no briefing (achievement/
 * mission/pack/level, além dos já existentes success/error/reward/info/
 * warning). Este arquivo é o nome de entregável pedido pelo briefing —
 * re-exporta o componente real em vez de duplicar o sistema.
 *
 * Uso (idêntico ao de antes, só a lista de tipos cresceu):
 *   import { toast } from '@/lib/wl-toast';
 *   toast.pack('📦 Classic Pack aberto!');
 *   toast.achievement('🏅 Primeira Lendária desbloqueada!');
 *   toast.mission('🎯 Missão concluída: Jogador Dedicado');
 *   toast.level('⭐ Você chegou ao nível 5!');
 */

export { WLToast as PremiumToast } from './WLToast';
