import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/auth';

export default async function AuthTestPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
          ✅ Authentication Successful!
        </h1>

        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Session Information
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{session.user?.email}</span>
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{session.user?.name || 'Not provided'}</span>
              </p>
              {session.user?.image && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Avatar:</span>
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-emerald-200 dark:border-emerald-700"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Full Session Object
            </h2>
            <pre className="text-xs overflow-auto bg-gray-900 text-green-400 p-3 rounded">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4 pt-4">
            <a
              href="/dashboard"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
            >
              Go to Dashboard
            </a>
            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/auth/signin' });
            }}>
              <button
                type="submit"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
