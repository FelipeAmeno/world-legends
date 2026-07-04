import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { PremiumHome } from '@/components/home/PremiumHome';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <PremiumHome />;
}
