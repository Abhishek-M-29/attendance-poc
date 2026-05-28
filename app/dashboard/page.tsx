import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function DashboardIndex() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'super_admin') {
    redirect('/dashboard/admin');
  } else if (profile?.role === 'faculty') {
    redirect('/dashboard/faculty');
  } else if (profile?.role === 'student') {
    redirect('/dashboard/student');
  } else {
    // If no role is found or an error occurs, send them back to login
    redirect('/login');
  }
}