/**
 * app/dev/asset-studio/page.tsx — Sprint 43A (Asset Studio Foundation)
 *
 * Rota interna do Asset Studio. Diferente de `/dev/card-assets` (só
 * autenticação genérica), esta rota checa `checkAssetStudioAuthorization`
 * explicitamente no servidor e NÃO renderiza nada além de uma mensagem
 * de acesso negado se falhar — nunca depende só de navegação escondida.
 *
 * Ferramenta interna e incompleta: sem botão de gerar de verdade (nenhum
 * provedor é chamado), sem geração em lote, sem publicação automática.
 */
import { AssetStudioExperience } from '@/components/dev/asset-studio/AssetStudioExperience';
import { listJobsAction } from '@/lib/actions/asset-studio';
import { checkAssetStudioAuthorization } from '@/lib/asset-studio/authorization';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AssetStudioPage() {
  const user = await getCurrentUser();
  const auth = checkAssetStudioAuthorization(user);

  if (!auth.authorized) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <h1 className="font-display text-xl text-parchment mb-2">Acesso negado</h1>
        <p className="text-muted text-sm">
          O Asset Studio é uma ferramenta interna. {auth.reason}.
        </p>
      </div>
    );
  }

  const result = await listJobsAction();
  const jobs = result.ok ? result.data : [];

  return <AssetStudioExperience initialJobs={jobs} />;
}
