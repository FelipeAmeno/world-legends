import { CollectionExperience } from '@/components/collection/CollectionExperience';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCollection } from '@/lib/collection-data';
import { getUserCollection } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function CollectionPage() {
  const user = await getCurrentUser();

  // Usuário autenticado → mostra cartas que ele possui
  // Visitante → mostra catálogo completo (preview)
  const allCards = user ? await getUserCollection(user.id) : getCollection();
  const isEmpty  = user !== null && allCards.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full">
        <div className="page-header shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: '#6a7090' }}>
            World Legends
          </p>
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">COLEÇÃO</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState variant="collection" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CollectionExperience allCards={allCards} />
    </div>
  );
}
