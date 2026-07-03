import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Perfil' };
import { ProfilePage } from '@/components/layout/profile-page';
export default function Page() { return <ProfilePage />; }
