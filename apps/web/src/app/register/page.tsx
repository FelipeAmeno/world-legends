import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Criar Conta' };
import { RegisterPage } from '@/components/auth/register-page';
export default function Page() { return <RegisterPage />; }
