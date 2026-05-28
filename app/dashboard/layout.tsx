import { Sidebar } from '@/components/sidebar';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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

  const userRole = profile?.role ?? null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}