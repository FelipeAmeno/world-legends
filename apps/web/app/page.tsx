/**
 * app/page.tsx — Home Screen Premium (T051)
 *
 * Server Component que renderiza a PremiumHome.
 * A PremiumHome tem seu próprio background, header e bottom nav —
 * por isso escapa do layout padrão via overflow.
 */
import { PremiumHome } from '@/components/home/PremiumHome';

export default function HomePage() {
  return <PremiumHome />;
}
