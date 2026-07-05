import { SocialHub } from '@/components/social/SocialHub';
import { MOCK_ACTIVITIES, MOCK_FRIENDS, MOCK_LEAGUES } from '@/lib/social-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SocialPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // TODO: replace mocks with real DB queries when social tables are migrated
  // const friends    = await getFriends(user.id);
  // const activities = await getFriendActivities(user.id);
  // const leagues    = await getUserLeagues(user.id);

  return (
    <div className="flex flex-col h-full">
      <SocialHub
        userId={user.id}
        friends={MOCK_FRIENDS}
        activities={MOCK_ACTIVITIES}
        leagues={MOCK_LEAGUES}
      />
    </div>
  );
}
