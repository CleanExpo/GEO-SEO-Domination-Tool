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
          <div className="text-xs text-gray-500">Token is stored locally in server/secrets/integrations.local.json (gitignored). For production, use a secret manager.</div>
          <button className="px-3 py-2 border rounded" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </div>

        <div className="border rounded p-4 space-y-3">
          <h2 className="font-medium">Vercel</h2>
          <input className="border rounded px-3 py-2 w-full" placeholder="Vercel Access Token" value={vercelToken} onChange={e=>setVercelToken(e.target.value)} />
          <div className="text-xs text-gray-500">Token is stored locally in server/secrets/integrations.local.json (gitignored).</div>
          <button className="px-3 py-2 border rounded" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-medium mb-2">Status</h2>
        <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[220px]">{JSON.stringify(status, null, 2) || 'No status yet.'}</pre>
      </div>
    </div>
  );
}
