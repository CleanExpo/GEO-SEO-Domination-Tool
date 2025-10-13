import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default async function ProPage(){
  const cookieStore = await cookies();
  const supa = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        }
      }
    }
  );

  const { data: { user } } = await supa.auth.getUser();
  if (!user){
    return (
      <div className='p-8'>
        Not signed in. Go to <a className='underline' href='/login'>login</a>.
      </div>
    );
  }

  const { data: profile } = await supa.from('profiles').select('role,email').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'free';

  if (role !== 'pro'){
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold mb-4'>Pro Features</h1>
        <p className='text-gray-600 mb-4'>You need a Pro subscription to access this page.</p>
        <a href='/pricing' className='px-4 py-2 bg-blue-600 text-white rounded inline-block'>Upgrade to Pro</a>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>🛡️ Pro Dashboard</h1>
      <p className='text-gray-600 mb-6'>Welcome {profile.email}! You have Pro access.</p>
      <div className='border rounded p-4 bg-green-50'>
        <h2 className='font-semibold mb-2'>Pro Features Unlocked</h2>
        <ul className='list-disc list-inside space-y-1 text-sm text-gray-700'>
          <li>Advanced analytics and reporting</li>
          <li>Priority support</li>
          <li>Custom integrations</li>
          <li>Unlimited API calls</li>
        </ul>
      </div>
    </div>
  );
}
