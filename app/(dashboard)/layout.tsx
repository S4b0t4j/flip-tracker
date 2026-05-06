import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header userEmail={user.email || ''} />
      <main className="ml-[250px] mt-16 p-8">{children}</main>
    </div>
  );
}
