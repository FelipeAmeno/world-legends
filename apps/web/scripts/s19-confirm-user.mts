import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];
if (!email) {
  console.error('usage: node scripts/s19-confirm-user.mts <email>');
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await db.auth.admin.listUsers();
if (error) throw error;
const user = data.users.find((u) => u.email === email);
if (!user) {
  console.error('user not found for', email);
  process.exit(1);
}

const { error: updateError } = await db.auth.admin.updateUserById(user.id, {
  email_confirm: true,
});
if (updateError) throw updateError;
console.log('confirmed', email, user.id);
