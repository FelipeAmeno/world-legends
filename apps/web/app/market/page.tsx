import { MarketExperience } from '@/components/market/MarketExperience';
/**
 * app/market/page.tsx — T063 Marketplace (estrutura)
 *
 * Server Component: carrega listings e entrega ao client.
 */
import { getListings } from '@/lib/marketplace/mock-listings';

export default function MarketPage() {
  const listings = getListings();
  return (
    <div className="flex flex-col h-full">
      <div className="page-header shrink-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5"
          style={{ color: '#6a7090' }}
        >
          Transferências
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">MERCADO</h1>
          <span
            className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-0.5"
            style={{
              background: 'rgba(201,168,76,0.10)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#c9a84c',
            }}
          >
            Em breve
          </span>
        </div>
        <p className="text-muted text-xs mt-1.5">
          {listings.length} cartas listadas · Economia completa em breve
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <MarketExperience listings={listings} />
      </div>
    </div>
  );
}
