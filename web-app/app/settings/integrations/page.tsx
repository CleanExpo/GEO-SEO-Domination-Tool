'use client';
import { useEffect, useState } from 'react';

async function post(action: string, params: any = {}) {
  const r = await fetch('/api/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, params }) });
  return r.json();
}

export default function IntegrationsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  // Supabase
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [sbStatus, setSbStatus] = useState<any>(null);
  const [sbSaving, setSbSaving] = useState(false);
  const [sbChecking, setSbChecking] = useState(false);

  async function save() {
    setSaving(true);
    await post('save_tokens', { githubToken: githubToken || undefined, vercelToken: vercelToken || undefined });
    setSaving(false);
    await check();
  }

  async function check() {
    setChecking(true);
    const j = await post('status');
    setStatus(j?.result || j);
    setChecking(false);
  }

  async function saveSupabase() {
    setSbSaving(true);
    await post('save_supabase', { supabaseUrl: supabaseUrl || undefined, supabaseAnonKey: supabaseAnonKey || undefined });
    setSbSaving(false);
    await checkSupabase();
  }

  async function checkSupabase() {
    setSbChecking(true);
    const j = await post('supabase_status', { supabaseUrl, supabaseAnonKey });
    setSbStatus(j?.result || j);
    setSbChecking(false);
  }

  useEffect(() => { check(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings → Integrations</h1>
        <button className="px-3 py-2 border rounded" onClick={check} disabled={checking}>{checking?'Checking…':'Refresh Status'}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 space-y-3">
          <h2 className="font-medium">GitHub</h2>
          <input className="border rounded px-3 py-2 w-full" placeholder="Personal Access Token" value={githubToken} onChange={e=>setGithubToken(e.target.value)} />
          <div className="text-xs text-gray-500">Token is stored locally (gitignored). For production, use a secret manager.</div>
          <button className="px-3 py-2 border rounded" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </div>

        <div className="border rounded p-4 space-y-3">
          <h2 className="font-medium">Vercel</h2>
          <input className="border rounded px-3 py-2 w-full" placeholder="Vercel Access Token" value={vercelToken} onChange={e=>setVercelToken(e.target.value)} />
          <div className="text-xs text-gray-500">Token is stored locally (gitignored).</div>
          <button className="px-3 py-2 border rounded" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </div>

        <div className="border rounded p-4 space-y-3 md:col-span-2">
          <h2 className="font-medium">Supabase</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 w-full" placeholder="Supabase URL (https://xxxx.supabase.co)" value={supabaseUrl} onChange={e=>setSupabaseUrl(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Supabase anon key" value={supabaseAnonKey} onChange={e=>setSupabaseAnonKey(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded" onClick={saveSupabase} disabled={sbSaving}>{sbSaving?'Saving…':'Save Supabase'}</button>
            <button className="px-3 py-2 border rounded" onClick={checkSupabase} disabled={sbChecking}>{sbChecking?'Checking…':'Check Supabase'}</button>
          </div>
          <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[160px]">{JSON.stringify(sbStatus, null, 2) || 'No Supabase status yet.'}</pre>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-2">GitHub/Vercel Status</h2>
        <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[160px]">{JSON.stringify(status, null, 2) || 'No status yet.'}</pre>
      </div>
    </div>
  );
}
