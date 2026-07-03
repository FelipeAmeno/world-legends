import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Eventos' };
import { EventsPage } from '@/components/layout/events-page';
export default function Page() { return <EventsPage />; }
