import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import QuickRequisitionModal from '@/Components/Requisitions/QuickRequisitionModal';
import RequisitionSummary from '@/Components/Requisitions/RequisitionSummary';
import EditProfileModal from '@/Components/Profile/EditProfileModal';
import ChangePasswordModal from '@/Components/Profile/ChangePasswordModal';
import AvatarModal from '@/Components/Profile/AvatarModal';
import EmptyState from '@/Components/ui/empty-state';
// Account deletion removed for regular users

interface Commission {
  id: number;
  source?: string | null;
  client_id?: number | null;
  amount: number;
  status: 'pending' | 'claimed' | 'rejected';
  created_at?: string;
  claimed_at?: string | null;
}

interface PageProps {
  [key: string]: any;
  user: { id: number; name: string; email: string; phone?: string | null; avatar_url?: string | null };
  commissions: { pending: Commission[]; recent: Commission[] };
  payroll: { totals: { salary_total: number; net_total: number; allowances_total: number; overtime_total: number } };
}

function currency(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (Number.isNaN(num)) return 'MWK 0.00';
  return `MWK ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProfileDashboard() {
  const { user, commissions, payroll, mustVerifyEmail = false, status } = usePage<PageProps>().props as any;
  const [tab, setTab] = React.useState<'profile' | 'commissions' | 'payroll'>('profile');
  const [showEdit, setShowEdit] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showAvatar, setShowAvatar] = React.useState(false);

  const claim = (id: number) => {
    if (!confirm('Claim this commission?')) return;
    router.post(route('profile.commissions.claim', { commission: id }), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Dashboard</h2>}>
      <Head title="My Dashboard" />
      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto px-2">
            <button
              onClick={() => setTab('profile')}
              className={`px-3 py-1.5 rounded-md text-sm ${tab === 'profile' ? 'bg-coin-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setTab('commissions')}
              className={`px-3 py-1.5 rounded-md text-sm ${tab === 'commissions' ? 'bg-coin-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}
            >
              Commissions
            </button>
            <button
              onClick={() => setTab('payroll')}
              className={`px-3 py-1.5 rounded-md text-sm ${tab === 'payroll' ? 'bg-coin-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}
            >
              Payroll
            </button>
          </div>

          <QuickRequisitionModal />
          <RequisitionSummary />

          {/* Profile */}
          {tab === 'profile' && (
            <>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                      <div className="text-gray-900 dark:text-gray-100 font-medium">{user?.name}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                    <div className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                    <div className="text-gray-900 dark:text-gray-100 font-medium">{user?.phone || '-'}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setShowAvatar(true)} className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm border dark:border-gray-700">Change Avatar</button>
                  <button onClick={() => setShowEdit(true)} className="inline-flex items-center px-4 py-2 rounded-md bg-coin-600 hover:bg-coin-700 text-white text-sm">Edit Profile</button>
                  <button onClick={() => setShowPassword(true)} className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-sm">Change Password</button>
                </div>
              </div>

              {/* Account deletion is restricted to admins; no self-delete UI here. */}
            </>
          )}

          {/* Commissions */}
          {tab === 'commissions' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-gray-100">Pending Commissions</div>
                <div className="p-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {(commissions?.pending || []).length === 0 && (
                    <EmptyState title="No pending commissions" description="New pending commissions will show up here." size="sm" contentClassName="py-4" />
                  )}
                  {(commissions?.pending || []).map((c: Commission) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.source || 'Referral'} {c.client_id ? `• Client #${c.client_id}` : ''}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Created {c.created_at ? new Date(c.created_at).toLocaleString() : ''}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currency(c.amount)}</div>
                        <button onClick={() => claim(c.id)} className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Claim</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-gray-100">Recent Commissions</div>
                <div className="p-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {(commissions?.recent || []).length === 0 && (
                    <EmptyState title="No recent commissions" description="Your latest commission activity will show here." size="sm" contentClassName="py-4" />
                  )}
                  {(commissions?.recent || []).map((c: Commission) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.source || 'Referral'} {c.client_id ? `• Client #${c.client_id}` : ''}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.status === 'claimed' ? `Claimed ${c.claimed_at ? new Date(c.claimed_at).toLocaleString() : ''}` : 'Rejected'}</div>
                      </div>
                      <div className={`text-sm font-semibold ${c.status === 'claimed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{currency(c.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payroll */}
          {tab === 'payroll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Salary</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{currency(payroll?.totals?.salary_total || 0)}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Allowances</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{currency(payroll?.totals?.allowances_total || 0)}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Overtime</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{currency(payroll?.totals?.overtime_total || 0)}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Net Paid</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{currency(payroll?.totals?.net_total || 0)}</div>
                </div>
              </div>
              <div className="bg-coin-50 dark:bg-gray-800 rounded-xl border border-coin-200 dark:border-gray-700 p-4 text-sm text-coin-900 dark:text-gray-200">
                Payroll figures reflect processed runs recorded in the system.
              </div>
            </div>
          )}
        </div>
      </div>
      <EditProfileModal show={showEdit} onClose={() => setShowEdit(false)} mustVerifyEmail={mustVerifyEmail} status={status} />
      <ChangePasswordModal show={showPassword} onClose={() => setShowPassword(false)} />
      <AvatarModal show={showAvatar} onClose={() => setShowAvatar(false)} />
    </AuthenticatedLayout>
  );
}
