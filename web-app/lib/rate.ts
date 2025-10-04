type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number;   // e.g., 60000
  max: number;        // e.g., 30
  key?: string;       // override key
};

function now(){ return Date.now(); }

export function rateLimitCheck(identifier: string, opt: RateLimitOptions){
  const key = opt.key || identifier;
  const b = buckets.get(key) || { hits: [] };
  const cutoff = now() - opt.windowMs;
  b.hits = b.hits.filter(t => t > cutoff);
  const allowed = b.hits.length < opt.max;
  if (allowed) { b.hits.push(now()); buckets.set(key, b); }
  const remaining = Math.max(0, opt.max - b.hits.length);
  return { allowed, remaining, resetMs: opt.windowMs - (now() - (b.hits[0] || now())) } as const;
}
