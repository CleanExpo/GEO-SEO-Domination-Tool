'use client';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TrackerInner({ release, color }: { release?: string; color?: 'blue'|'green'|null }){
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(()=>{
    const body = { type:'view', path: pathname + (search?.toString()? ('?'+search.toString()) : ''), ref: document.referrer||'', release: release||'', color: color||null };
    fetch('/api/analytics', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) }).catch(()=>{});
  }, [pathname, search, release, color]);
  return null;
}

export function ClientTracker(props: { release?: string; color?: 'blue'|'green'|null }){
  return <Suspense fallback={null}><TrackerInner {...props} /></Suspense>;
}
