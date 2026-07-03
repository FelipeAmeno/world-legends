import { CollectionExperience } from '@/components/collection/CollectionExperience';
import { getCollection } from '@/lib/collection-data';
import { getUserCollection } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function CollectionPage() {
  const user = await getCurrentUser();

  // Usuário autenticado → mostra cartas que ele possui
  // Visitante → mostra catálogo completo (preview)
  const allCards = user ? await getUserCollection(user.id) : getCollection();

  return (
    <div className="flex flex-col h-full">
      <CollectionExperience allCards={allCards} />
    </div>
  );
}
