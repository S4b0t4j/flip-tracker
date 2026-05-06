import { createClient } from '@/lib/supabase/server';
import { FeedbackForm } from '@/components/Feedback/FeedbackForm';
import { formatDate } from '@/lib/utils';

export default async function FeedbackPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: feedback = [] } = await supabase
    .from('feedback_logs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-sm text-muted-foreground">Report bugs or request features.</p>
      </div>

      <FeedbackForm userEmail={user?.email || ''} />

      <div className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your submissions</h2>
        </div>
        {(feedback || []).length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(feedback || []).map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-2">{formatDate(f.created_at)}</td>
                  <td className="px-4 py-2">{f.type}</td>
                  <td className="px-4 py-2">{f.severity || '—'}</td>
                  <td className="px-4 py-2 font-medium">{f.title}</td>
                  <td className="px-4 py-2">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
