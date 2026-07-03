import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Entrar' };
import { LoginPage } from '@/components/auth/login-page';
export default function Page() { return <LoginPage />; }
