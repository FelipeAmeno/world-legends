import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Detalhe da Carta' };
import { CardDetailPage } from '@/components/collection/card-detail-page';
export default function Page({ params }: { params: { id: string } }) { return <CardDetailPage id={params.id} />; }
