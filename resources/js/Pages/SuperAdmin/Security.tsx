import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import ConfirmModal from '@/Components/ConfirmModal';

interface Props {
  auth?: any;
}

const Security: React.FC<Props> = ({ auth }) => {
  const safeRoute = React.useCallback((name: string, params?: any) => {
    try {
      return route(name, params) as unknown as string;
    } catch {
      return null;
    }
  }, []);

  const [overview, setOverview] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    routeName: string;
  } | null>(null);

  const loadOverview = React.useCallback(async () => {
    const url = safeRoute('superadmin.security.overview');
    if (!url) {
      setOverview(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      const json = await res.json();
      setOverview(json);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [safeRoute]);

  React.useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const openConfirm = (payload: { title: string; message: string; confirmLabel?: string; routeName: string }) => {
    setConfirmState(payload);
    setConfirmOpen(true);
  };

  const runConfirmedAction = () => {
    if (!confirmState) return;
    const href = safeRoute(confirmState.routeName);
    if (!href) {
      setConfirmOpen(false);
      setConfirmState(null);
      return;
    }

    router.post(href, {}, {
      preserveScroll: true,
      onFinish: () => {
        setConfirmOpen(false);
        setConfirmState(null);
        setTimeout(loadOverview, 800);
      },
    });
  };

  return (
    <AuthenticatedLayout header="Security" user={auth?.user}>
      <Head title="Security" />

      <ConfirmModal
        open={confirmOpen}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmState(null);
        }}
        onConfirm={runConfirmedAction}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3">
            <IconMapper name="Shield" size={28} />
            <h1 className="text-2xl font-bold">Security Center</h1>
          </div>
          <p className="mt-2 text-sm text-red-100">Security posture, access control and emergency actions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const href = safeRoute('superadmin.roles.index');
            if (!href) return null;
            return (
              <Link
                href={href}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <IconMapper name="Key" size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Roles & Permissions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Assign and manage access</div>
                  </div>
                </div>
              </Link>
            );
          })()}

          {(() => {
            const href = safeRoute('superadmin.users');
            if (!href) return null;
            return (
              <Link
                href={href}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    <IconMapper name="Users2" size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Users</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">View and manage all users</div>
                  </div>
                </div>
              </Link>
            );
          })()}

          {(() => {
            const href = safeRoute('superadmin.settings');
            if (!href) return null;
            return (
              <Link
                href={href}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-100 dark:border-gray-700 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <IconMapper name="Settings" size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">System Settings</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Configure global policies</div>
                  </div>
                </div>
              </Link>
            );
          })()}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Posture</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Live configuration and token/session health.</p>
            </div>
            <button
              onClick={loadOverview}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${loading ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-wait' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {overview ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">App Env</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{overview?.app?.env || 'unknown'}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Debug: {String(overview?.app?.debug ?? false)}</div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{overview?.session?.driver || 'unknown'}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Count: {overview?.counts?.sessions ?? '—'}</div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Password Resets</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{overview?.auth?.password_reset_table || '—'}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tokens: {overview?.counts?.password_reset_tokens ?? '—'}</div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Users</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{overview?.counts?.users ?? '—'}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Active: {overview?.counts?.active_users ?? '—'}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">Overview unavailable.</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Emergency Actions</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Use these to contain breaches quickly.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() =>
                openConfirm({
                  title: 'Force logout (all other sessions)',
                  message: 'This will revoke all other active sessions. Your current session remains active.',
                  confirmLabel: 'Force Logout',
                  routeName: 'superadmin.security.force-logout',
                })
              }
              className="w-full text-left rounded-lg border border-red-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-red-600/10 dark:bg-red-900/30 text-red-700 dark:text-red-200 flex items-center justify-center">
                  <IconMapper name="LogOut" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Force Logout</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">End all other sessions immediately</div>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                openConfirm({
                  title: 'Invalidate remember tokens',
                  message: 'This will invalidate “remember me” tokens for other users, forcing them to login again.',
                  confirmLabel: 'Invalidate',
                  routeName: 'superadmin.security.invalidate-remember-tokens',
                })
              }
              className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-rose-600/10 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 flex items-center justify-center">
                  <IconMapper name="ShieldOff" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Invalidate Remember Tokens</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Force re-auth for remembered sessions</div>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                openConfirm({
                  title: 'Clear password reset tokens',
                  message: 'This will delete all password reset tokens. Pending resets will be invalidated.',
                  confirmLabel: 'Clear Tokens',
                  routeName: 'superadmin.security.clear-password-reset-tokens',
                })
              }
              className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-amber-600/10 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 flex items-center justify-center">
                  <IconMapper name="KeyRound" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Clear Password Reset Tokens</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Invalidate all pending password resets</div>
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                openConfirm({
                  title: 'Revoke API tokens',
                  message: 'This will delete all personal access tokens (API tokens). Any integrations using them will break until re-issued.',
                  confirmLabel: 'Revoke Tokens',
                  routeName: 'superadmin.security.revoke-api-tokens',
                })
              }
              className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-purple-600/10 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 flex items-center justify-center">
                  <IconMapper name="Fingerprint" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Revoke API Tokens</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cut off API access immediately</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-gray-700 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Best Practices</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Use least-privilege roles for non-admin users.</li>
            <li>Regularly review role assignments and inactive accounts.</li>
            <li>Rotate privileged credentials and enable device security.</li>
          </ul>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Security;
