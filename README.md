# Pulso - Dashboard Pages

## Structure

```
app/
├── layout.tsx                 # Root layout (global styles)
├── globals.css               # Global CSS reset
└── (dashboard)/              # Route group for authenticated pages
    ├── layout.tsx            # Dashboard layout with sidebar
    ├── dashboard.css         # Dashboard-specific styles
    └── page.tsx              # Main dashboard page (/)
```

## Features Implemented

✅ **Main Dashboard Page** - Displays welcome message and user's next donation info
✅ **Sidebar Navigation** - Fixed sidebar with navigation links
✅ **Responsive Design** - Mobile-friendly layout
✅ **Styled Components** - All styles from your HTML converted to CSS modules

## Route Groups

The `(dashboard)` folder is a **route group** - the parentheses mean it won't affect the URL structure. This allows you to:
- Share a layout (sidebar) across multiple pages
- Keep dashboard pages organized
- Add authentication logic in one place later

## Next Steps - Data Integration

### 1. Set up Supabase Client

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component
          }
        },
      },
    }
  )
}
```

### 2. Fetch User Data in Layout

In `app/(dashboard)/layout.tsx`, replace the hardcoded user:

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile from your database
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  const userInitials = profile?.name?.charAt(0).toUpperCase() || 'U';

  return (
    // ... rest of layout
  );
}
```

### 3. Fetch Dashboard Data

In `app/(dashboard)/page.tsx`, replace hardcoded data:

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, last_donation_date')
    .eq('id', user.id)
    .single();

  // Calculate next eligible donation date (56 days after last donation)
  const lastDonation = new Date(profile.last_donation_date);
  const nextEligibleDate = new Date(lastDonation);
  nextEligibleDate.setDate(nextEligibleDate.getDate() + 56);

  // Fetch user's next registered campaign
  const { data: nextCampaign } = await supabase
    .from('campaign_registrations')
    .select(`
      campaigns (
        name,
        date,
        start_time,
        end_time,
        location,
        donation_type
      )
    `)
    .eq('user_id', user.id)
    .gte('campaigns.date', new Date().toISOString())
    .order('campaigns.date', { ascending: true })
    .limit(1)
    .single();

  return (
    // ... render with real data
  );
}
```

### 4. Active Navigation Links

To make navigation links show as active based on current route, convert them to a Client Component:

Create `app/(dashboard)/components/SidebarNav.tsx`:
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/campaigns', label: 'Buscar campañas' },
    { href: '/history', label: 'Historial' },
    { href: '/profile', label: 'Perfil' },
    { href: '/help', label: 'Ayuda' },
  ];

  return (
    <nav>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'active' : ''}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

Then use it in your layout.

### 5. Database Schema Example

```sql
-- Users profile table
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  email text not null,
  avatar_url text,
  blood_type text,
  last_donation_date date,
  created_at timestamp with time zone default now()
);

-- Campaigns table
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  donation_type text not null,
  created_at timestamp with time zone default now()
);

-- Campaign registrations
create table campaign_registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles not null,
  campaign_id uuid references campaigns not null,
  status text default 'inscrita',
  created_at timestamp with time zone default now()
);
```

## Additional Pages to Create

To complete the app, you'll need:
- `/campaigns` - Browse and search campaigns
- `/history` - Donation history
- `/profile` - User profile and settings
- `/help` - Help and FAQ
- `/login` - Authentication page

Let me know which page you'd like to implement next!