/**
 * lib/asset-studio/authorization.ts — Sprint 43A (Asset Studio Foundation)
 *
 * LIMITAÇÃO TEMPORÁRIA DOCUMENTADA: este projeto não tem nenhum conceito
 * de role/admin no banco hoje (auditado nesta sprint — `profiles` não
 * tem coluna de role, não existe tabela de permissão, `apps/admin` é só
 * um stub `export {}` sem auth própria). As rotas `/dev/*` existentes só
 * checam "usuário autenticado" (middleware genérico), não "usuário
 * interno" — qualquer jogador logado consegue abrir `/dev/card-assets`
 * hoje.
 *
 * Pra não repetir essa lacuna no Asset Studio (que grava linhas de
 * verdade num domínio interno, não só visualiza dev tools), a
 * autorização aqui é uma ALLOWLIST de e-mail via variável de ambiente
 * server-only (`ASSET_STUDIO_ALLOWED_EMAILS`, nunca `NEXT_PUBLIC_*` —
 * nunca chega no bundle do browser). Isso é deliberadamente mais
 * restritivo que qualquer outra rota `/dev/*` hoje.
 *
 * Quando um modelo de role real existir no projeto (coluna
 * `profiles.role`, ou `apps/admin` ganhar autenticação própria), esta
 * função deve ser o ÚNICO lugar atualizado — toda rota/server
 * action/storage access do Asset Studio já chama só isto, nunca reimplementa
 * a checagem.
 */

function getAllowlist(): string[] {
  const raw = process.env.ASSET_STUDIO_ALLOWED_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type AssetStudioAuthResult = { authorized: true } | { authorized: false; reason: string };

/**
 * `user` é o resultado de `getCurrentUser()` (`lib/supabase/server.ts`) —
 * `null` quando deslogado. Nunca autoriza sem e-mail confirmado E
 * presente na allowlist configurada.
 */
export function checkAssetStudioAuthorization(
  user: { email?: string | null } | null,
): AssetStudioAuthResult {
  if (!user) return { authorized: false, reason: 'não autenticado' };
  const allowlist = getAllowlist();
  if (allowlist.length === 0) {
    return {
      authorized: false,
      reason:
        'ASSET_STUDIO_ALLOWED_EMAILS não configurado — nenhum usuário é autorizado por padrão (fail-closed)',
    };
  }
  const email = user.email?.trim().toLowerCase();
  if (!email || !allowlist.includes(email)) {
    return { authorized: false, reason: 'e-mail não está na allowlist do Asset Studio' };
  }
  return { authorized: true };
}
