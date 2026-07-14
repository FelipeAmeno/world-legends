import { JobDetailView } from '@/components/dev/asset-studio/JobDetailView';
import { getJobDetailsAction } from '@/lib/actions/asset-studio';
import { checkAssetStudioAuthorization } from '@/lib/asset-studio/authorization';
import { getCurrentUser } from '@/lib/supabase/server';
/**
 * app/dev/asset-studio/[jobId]/page.tsx — Sprint 43A (Asset Studio Foundation)
 */
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AssetStudioJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await getCurrentUser();
  const auth = checkAssetStudioAuthorization(user);

  if (!auth.authorized) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center">
        <h1 className="font-display text-xl text-parchment mb-2">Acesso negado</h1>
        <p className="text-muted text-sm">{auth.reason}.</p>
      </div>
    );
  }

  const result = await getJobDetailsAction(jobId);
  if (!result.ok || !result.data) notFound();

  return <JobDetailView details={result.data} />;
}
