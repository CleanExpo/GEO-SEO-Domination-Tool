'use client';
import { useEffect, useMemo, useState } from 'react';

async function api(action: string, params: any = {}) {
  const r = await fetch('/api/builds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, params }) });
  return r.json();
}

export default function BuildsPage() {
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  const [routeName, setRouteName] = useState('health');
  const [schemaName, setSchemaName] = useState('events');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const resp = await fetch('/api/builds');
      const j = await resp.json();
      if (j?.ok && j?.result?.builders) setBuilders(j.result.builders);
      setLoading(false);
    })();
  }, []);

  async function doInspect(id: string) {
    setSelected(id);
    setLog('Inspecting…');
    const j = await api('inspect_builder', { id });
    setLog(JSON.stringify(j, null, 2));
  }

  async function doPreview(id: string) {
    setSelected(id);
    setLog('Previewing…');
    const variables: any = {};
    if (id === 'nextjs-api-route') variables.ROUTE_NAME = routeName;
    if (id === 'database-schema') variables.SCHEMA_NAME = schemaName;
    const j = await api('preview_apply', { id, engine: 'eta', variables });
    setLog(JSON.stringify(j, null, 2));
  }

  async function doApply(id: string) {
    setSelected(id);
    setLog('Applying…');
    const variables: any = {};
    if (id === 'nextjs-api-route') variables.ROUTE_NAME = routeName;
    if (id === 'database-schema') variables.SCHEMA_NAME = schemaName;
    const j = await api('apply_builder', { id, strategy: 'safe-merge', engine: 'eta', variables });
    setLog(JSON.stringify(j, null, 2));
  }

  async function doChecks() {
    setLog('Running checks…');
    const j = await api('post_install_check', { checks: ['ts','lint','next-build'] });
    setLog(JSON.stringify(j, null, 2));
  }

  const hasBuilders = useMemo(() => (builders?.length ?? 0) > 0, [builders]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects → Builds</h1>
        <button className="px-3 py-2 border rounded" onClick={doChecks}>Run Checks</button>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-500">MCP is invoked on-demand from the server API. Actions: Inspect, Preview, Apply.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Builder Catalog</h2>
          {loading && <div>Loading…</div>}
          {!loading && !hasBuilders && <div>No builders found. Ensure /builders has manifests.</div>}
          <ul className="space-y-2">
            {builders.map((b: any) => (
              <li key={b.id} className={`border rounded p-3 ${selected===b.id?'bg-gray-50':''}`}>
                <div className="font-semibold">{b.title} <span className="text-xs text-gray-500">({b.id})</span></div>
                {b.summary && <div className="text-sm text-gray-600">{b.summary}</div>}
                <div className="mt-2 flex gap-2">
                  <button className="px-2 py-1 border rounded" onClick={() => doInspect(b.id)}>Inspect</button>
                  <button className="px-2 py-1 border rounded" onClick={() => doPreview(b.id)}>Preview</button>
                  <button className="px-2 py-1 border rounded" onClick={() => doApply(b.id)}>Apply</button>
                </div>
                {b.id==='nextjs-api-route' && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <label className="w-28">ROUTE_NAME</label>
                    <input className="border rounded px-2 py-1 w-full" value={routeName} onChange={(e)=>setRouteName(e.target.value)} />
                  </div>
                )}
                {b.id==='database-schema' && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <label className="w-28">SCHEMA_NAME</label>
                    <input className="border rounded px-2 py-1 w-full" value={schemaName} onChange={(e)=>setSchemaName(e.target.value)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Logs / Output</h2>
          <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[320px]">{log || 'Select an action to see output…'}</pre>
        </div>
      </div>
    </div>
  );
}
