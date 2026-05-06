import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and preferences.</p>
      </div>
      <div className="card space-y-3 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Account ID</div>
            <div className="font-mono text-xs">{user?.id}</div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Sign out</h2>
        <form action="/auth/sign-out" method="POST">
          <button type="submit" className="btn-danger">Sign out</button>
        </form>
      </div>
    </div>
  );
}
