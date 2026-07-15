/**
 * lib/asset-studio/storage.ts — Sprint 43B (Gemini Nano Banana Image Provider)
 *
 * Porta de storage de staging — mesmo padrão Ports & Adapters de
 * `repository.ts` (Sprint 43A). `SupabaseAssetStudioStorage` grava no
 * bucket privado `asset-studio` (criado por
 * `supabase/migrations/..._asset_studio_storage_bucket.sql`, sem policy
 * pra anon/authenticated — só service_role). `InMemoryAssetStudioStorage`
 * é o fallback de dev local sem Supabase configurado E o que todo teste
 * usa — nenhum teste toca Storage real, mesma convenção "Fase 6" do
 * resto do Asset Studio.
 *
 * NUNCA escreve em `apps/web/public/assets/cards/source/artworks` — os
 * únicos caminhos aceitos vêm de `storage-paths.ts`, sempre prefixados
 * `asset-studio/`.
 */

import { getServiceDb } from '@/lib/server/db';

export type PutObjectResult = { path: string; size: number };
export type StoredObject = { bytes: Uint8Array; mimeType: string };

export interface AssetStudioStorage {
  putObject(path: string, bytes: Uint8Array, mimeType: string): Promise<PutObjectResult>;
  getObject(path: string): Promise<StoredObject | null>;
}

type SupabaseStorageLike = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        opts: { contentType: string; upsert: boolean },
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
      download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
    };
  };
};

/**
 * Dev local sem Supabase Storage configurado, e todo teste — guarda em
 * memória, nunca em disco. Singleton exportado (`inMemoryAssetStudioStorage`)
 * de propósito: uma instância nova por chamada de Server Action perderia
 * tudo que foi "salvo" na chamada anterior. Isso só é seguro pra dev
 * local single-process — nunca usado em produção (produção sempre tem
 * Supabase configurado, ver `provider-config.ts`/`lib/actions/asset-studio.ts`).
 */
export class InMemoryAssetStudioStorage implements AssetStudioStorage {
  private objects = new Map<string, StoredObject>();

  async putObject(path: string, bytes: Uint8Array, mimeType: string): Promise<PutObjectResult> {
    if (!path.startsWith('asset-studio/')) {
      throw new Error(`caminho de storage fora da convenção do Asset Studio: ${path}`);
    }
    this.objects.set(path, { bytes, mimeType });
    return { path, size: bytes.length };
  }

  async getObject(path: string): Promise<StoredObject | null> {
    return this.objects.get(path) ?? null;
  }
}

export const inMemoryAssetStudioStorage = new InMemoryAssetStudioStorage();

export class SupabaseAssetStudioStorage implements AssetStudioStorage {
  private db(): SupabaseStorageLike {
    // Cast local — ver nota de tipagem em supabase-repository.ts (bucket
    // novo desta sprint, `Database` ainda não regenerado contra um
    // projeto Supabase linkado).
    return getServiceDb() as unknown as SupabaseStorageLike;
  }

  async putObject(path: string, bytes: Uint8Array, mimeType: string): Promise<PutObjectResult> {
    if (!path.startsWith('asset-studio/')) {
      throw new Error(`caminho de storage fora da convenção do Asset Studio: ${path}`);
    }
    const { error } = await this.db()
      .storage.from('asset-studio')
      .upload(path.replace(/^asset-studio\//, ''), bytes, {
        contentType: mimeType,
        upsert: false,
      });
    if (error) throw new Error(`upload de storage falhou: ${error.message}`);
    return { path, size: bytes.length };
  }

  async getObject(path: string): Promise<StoredObject | null> {
    const { data, error } = await this.db()
      .storage.from('asset-studio')
      .download(path.replace(/^asset-studio\//, ''));
    if (error || !data) return null;
    const bytes = new Uint8Array(await data.arrayBuffer());
    return { bytes, mimeType: data.type || 'image/png' };
  }
}
