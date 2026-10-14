import { Truck } from 'lucide-react'

// Shown when the Supabase keys are missing, instead of a broken app.
export default function SetupScreen() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white"><Truck size={20} /></div>
          <h1 className="text-lg font-bold text-slate-900">Connect Supabase</h1>
        </div>
        <p className="mt-3 text-sm text-slate-600">The admin panel needs two values from your Supabase project before it can start.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Supabase dashboard, then <b>Project Settings</b>, then <b>API</b>. Copy the project URL and the anon (publishable) key.</li>
          <li>
            Create a file named <code className="rounded bg-slate-100 px-1">.env</code> next to <code className="rounded bg-slate-100 px-1">package.json</code> with:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
          </li>
          <li>Restart <code className="rounded bg-slate-100 px-1">npm run dev</code>. On Vercel, add the same two variables under Project Settings, Environment Variables, then redeploy.</li>
        </ol>
        <p className="mt-4 text-xs text-slate-400">Never put the service-role key here. It must stay on the server.</p>
      </div>
    </div>
  )
}
