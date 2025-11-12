import Link from 'next/link';
import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from './components/LogoutButton';
import { Navigation } from './components/Navigation';
import './dashboard.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) {
    redirect('/login');
  }

  // Fetch user profile from user_info table
  const { data: userInfo } = await supabase
    .from('user_info')
    .select('name, last_name, email, is_complete, role')
    .eq('id', authUser.id)
    .single();

  if (!userInfo || !userInfo.is_complete) {
    redirect('/register/complete-profile');
  }

  const userName = userInfo.name || authUser.email?.split('@')[0] || 'Usuario';
  const userInitials = userName.charAt(0).toUpperCase();
  const userRole = userInfo.role;

  const user = {
    name: userName,
    initials: userInitials,
    role: userRole
  };

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside>
        <Link className="brand" href={user.role === 'admin' ? "/admin/campaigns" : "/"}>
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 6c9.5 12.7 22 23.2 22 36 0 12-9.8 22-22 22S10 54 10 42C10 29.2 22.5 18.7 32 6Z" fill="var(--pulso-red)"/>
            <path d="M15 39h10.2c.8 0 1.6-.5 1.9-1.3l3.7-9.4 5.5 16.1c.3.8 1 1.3 1.8 1.3h9.9" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
          </svg>
          <span className="name">Pulso</span>
        </Link>

        <Navigation userRole={user.role} />

        <div className="profile">
          <div className="avatar">{user.initials}</div>
          <span>{user.name}</span>
          {user.role === 'admin' && (
            <span className="admin-badge">Admin</span>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  );
}