import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    redirect('/login');
  }

  // Check if user has admin role
  const { data: userInfo } = await supabase
    .from('user_info')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (!userInfo || userInfo.role !== 'admin') {
    // Not an admin, redirect to home
    redirect('/');
  }

  return <>{children}</>;
}
