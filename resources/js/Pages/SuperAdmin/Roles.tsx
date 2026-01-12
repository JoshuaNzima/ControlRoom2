import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { router, useForm } from '@inertiajs/react';
import { X, Plus, Trash2, UserPlus, Shield, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

const ConfirmModal = lazy(() => import('@/Components/ConfirmModal'));

interface User { id: number; name: string; email: string }
interface Permission { id: number; name: string }
interface Role { id: number; name: string; permissions: Permission[]; users: User[] }

interface RolesResponse {
  data: Role[];
  current_page: number;
  last_page: number;
  from: number;
  to: number;
  total: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

interface Props { roles: RolesResponse; permissions: { data: Permission[] }; users: { data: User[] }; flash?: { success?: string; error?: string } }

const RoleCard = React.memo(function RoleCard({ role, permissions, users, toggling, assigning, removing, onTogglePermission, onAssignUser, onRemoveUser, onDelete, openConfirm }: any) {
  const [expanded, setExpanded] = useState(true);
  const [showAllPerms, setShowAllPerms] = useState(false);
  const PERM_SHOW_LIMIT = 6;

  // Use global permissions list for toggling; reflect active state from role.permissions
  const allPermissions: Permission[] = (permissions?.data ?? permissions ?? []) as Permission[];
  const displayedPermissions = showAllPerms ? allPermissions : allPermissions.slice(0, PERM_SHOW_LIMIT);

  return (
    <article aria-labelledby={`role-${role.id}-title`} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-150 hover:shadow-md">
      <header className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button aria-expanded={expanded} aria-controls={`role-${role.id}-panel`} onClick={() => setExpanded(prev => !prev)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-coin-500">
                  {expanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </button>
                <div>
                  <h3 id={`role-${role.id}-title`} className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200">{role.permissions?.length ?? 0} Permissions</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{role.users?.length ?? 0} Users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label={`Delete role ${role.name}`} onClick={() => openConfirm('Delete Role', `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`, () => onDelete(role.id, role.name))} className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </button>
          </div>
        </div>
      </header>

      {expanded && (
        <div className="p-6" id={`role-${role.id}-panel`}>
          <section aria-label="permissions" className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {displayedPermissions.map((permission: Permission) => {
                const isActive = role.permissions?.some((p: Permission) => p.name === permission.name);
                return (
                  <button key={permission.id} type="button" onClick={() => onTogglePermission(role.id, permission.name)} role="switch" aria-checked={isActive} aria-label={`${isActive ? 'Revoke' : 'Grant'} ${permission.name} for ${role.name}`} disabled={!!toggling[role.id]} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-coin-100 text-coin-800 dark:bg-coin-900/30 dark:text-coin-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} ${!!toggling[role.id] ? 'opacity-70 cursor-wait' : ''}`}>
                    {permission.name}{isActive && <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-coin-700 text-white text-[10px]">✓</span>}
                  </button>
                )
              })}

              {allPermissions.length > PERM_SHOW_LIMIT && (
                <button type="button" onClick={() => setShowAllPerms(prev => !prev)} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
                  {showAllPerms ? 'Show less' : `+${(allPermissions.length - PERM_SHOW_LIMIT)} more`}
                </button>
              )}
              {allPermissions.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No permissions defined yet. Create one on the left.</div>
              )}
            </div>
          </section>

          <section aria-label="assigned-users">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Users</h4>
              <div className="relative w-full sm:w-64">
                <select onChange={(e) => { const userId = Number((e.target as HTMLSelectElement).value); if (userId) { onAssignUser(role.id, userId); (e.target as HTMLSelectElement).value = ''; } }} disabled={!!assigning[role.id]} aria-label={`Assign user to ${role.name}`} className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-coin-500 dark:bg-gray-700 dark:text-white sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed" defaultValue="">
                  <option value="">Select a user to add...</option>
                  {users?.filter((u: User) => !role.users?.some((ru: User) => ru.id === u.id)).map((u: User) => (<option key={u.id} value={u.id}>{u.name} — {u.email}</option>))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><UserPlus className="h-4 w-4 text-gray-400" /></div>
              </div>
            </div>

            {role.users?.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {role.users.map((user: User) => (
                  <div key={user.id} className="inline-flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-3 pr-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <span className="truncate">{user.name}</span>
                    <button type="button" onClick={() => openConfirm('Remove User', `Are you sure you want to remove ${user.name} from the ${role.name} role?`, () => onRemoveUser(role.id, user.id))} disabled={!!removing[role.id]} aria-label={`Remove ${user.name} from ${role.name}`} aria-busy={!!removing[role.id]} className="ml-1.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed">
                      {removing[role.id] ? (<svg className="animate-spin h-3.5 w-3.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<X className="h-3.5 w-3.5" />)}
                    </button>
                  </div>
                ))}
              </div>
            ) : (<div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No users assigned to this role yet.</div>)}
          </section>
        </div>
      )}
    </article>
  )
})

export default function Roles({ roles, permissions, users, flash = {} }: Props) {
  const roleForm = useForm({ name: '' });
  const permissionForm = useForm({ name: '' });
  const [search, setSearch] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const [assigning, setAssigning] = useState<Record<number, boolean>>({});
  const [removing, setRemoving] = useState<Record<number, boolean>>({});
  const [toggling, setToggling] = useState<Record<number, boolean>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const roleNameRef = useRef<HTMLInputElement | null>(null);
  const permissionNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { roleNameRef.current?.focus() }, []);

  const openConfirm = (title: string, message: string, action: () => void) => { setConfirmTitle(title); setConfirmMessage(message); setConfirmAction(() => action); setConfirmOpen(true) };

  const createRole = (e: React.FormEvent) => { e.preventDefault(); if (!roleForm.data.name.trim()) return roleForm.setError('name', 'Please enter a role name'); roleForm.post('/superadmin/roles', { preserveState: false, onSuccess: () => { roleForm.reset('name'); roleNameRef.current?.focus() } }) };

  const deleteRole = useCallback((roleId: number, roleName: string) => { router.delete(`/superadmin/roles/${roleId}`) }, []);

  const createPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionForm.data.name.trim()) return permissionForm.setError('name', 'Please enter a permission name');
    permissionForm.post('/superadmin/permissions', {
      onSuccess: () => {
        permissionForm.reset('name');
        permissionNameRef.current?.focus();
        router.reload({ only: ['roles','permissions','users','flash'] });
      },
    });
  };

  const togglePermission = useCallback((roleId: number, permName: string) => { setToggling(prev => ({ ...prev, [roleId]: true })); router.post(`/superadmin/roles/${roleId}/toggle-permission`, { permission: permName }, { preserveScroll: true, onFinish: () => setToggling(prev => { const copy = { ...prev }; delete copy[roleId]; return copy }) }) }, []);

  const assignUser = useCallback((roleId: number, userId: number) => { if (!userId) return; setAssigning(prev => ({ ...prev, [roleId]: true })); router.post(`/superadmin/roles/${roleId}/assign-user`, { user_id: userId }, { preserveScroll: true, onFinish: () => setAssigning(prev => { const copy = { ...prev }; delete copy[roleId]; return copy }) }) }, []);

  const removeUser = useCallback((roleId: number, userId: number) => { setRemoving(prev => ({ ...prev, [roleId]: true })); router.post(`/superadmin/roles/${roleId}/remove-user`, { user_id: userId }, { preserveScroll: true, onFinish: () => setRemoving(prev => { const copy = { ...prev }; delete copy[roleId]; return copy }) }) }, []);

  const changePage = useCallback((pageUrl: string | null) => { if (!pageUrl) return; router.get(pageUrl) }, []);

  const searchRoles = useCallback((e: React.FormEvent) => { e.preventDefault(); router.get('/superadmin/roles', { q: search, q_user: searchUser }, { only: ['roles','permissions','users','flash'], preserveState: true, preserveScroll: true }) }, [search, searchUser]);

  const userOptions = useMemo(() => users?.data ?? [], [users]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage user roles and their permissions</p>
        </div>
        <div className="flex items-center space-x-2"><div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">Page {roles?.current_page ?? 1} of {roles?.last_page ?? 1}</div></div>
      </div>

      {flash?.success && (<div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start"><div className="flex-shrink-0 h-5 w-5 text-green-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div><div className="ml-3"><p className="text-sm font-medium">{flash.success}</p></div></div>)}

      {flash?.error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start"><div className="flex-shrink-0 h-5 w-5 text-red-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div><div className="ml-3"><p className="text-sm font-medium">{flash.error}</p></div></div>)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-coin-50 to-coin-100 dark:from-coin-900/30 dark:to-coin-900/10 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Role</h2><Shield className="h-5 w-5 text-coin-600 dark:text-coin-400" /></div>
            </div>
            <div className="p-6">
              <form onSubmit={createRole} className="space-y-4">
                <div>
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role Name <span className="text-red-500 ml-0.5">*</span></label>
                  <input ref={roleNameRef} id="roleName" type="text" value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-coin-500 focus:ring-coin-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 sm:text-sm transition duration-150 ease-in-out" placeholder="e.g. finance_officer" required />
                  {roleForm.errors.name && (<p className="mt-1 text-sm text-red-600 dark:text-red-400">{roleForm.errors.name}</p>)}
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={roleForm.processing} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-coin-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-coin-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">{roleForm.processing ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</>) : (<><Plus className="-ml-1 mr-2 h-4 w-4" />Create Role</>)}</button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-6 py-4 bg-gradient-to-r from-coin-50 to-coin-100 dark:from-coin-900/30 dark:to-coin-900/10 border-b border-gray-200 dark:border-gray-700"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Permission</h2><Shield className="h-5 w-5 text-coin-600 dark:text-coin-400" /></div></div>
            <div className="p-6">
              <form onSubmit={createPermission} className="space-y-4">
                <div>
                  <label htmlFor="permissionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Permission Name <span className="text-red-500 ml-0.5">*</span></label>
                  <input ref={permissionNameRef} id="permissionName" type="text" value={permissionForm.data.name} onChange={e => permissionForm.setData('name', e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-coin-500 focus:ring-coin-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 sm:text-sm transition duration-150 ease-in-out" placeholder="e.g. finance.view" required />
                  {permissionForm.errors.name && (<p className="mt-1 text-sm text-red-600 dark:text-red-400">{permissionForm.errors.name}</p>)}
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={permissionForm.processing} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-coin-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-coin-700 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">{permissionForm.processing ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</>) : (<><Plus className="-ml-1 mr-2 h-4 w-4" />Create Permission</>)}</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900/80 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Roles List</h2><p className="text-sm text-gray-600 dark:text-gray-400">Manage user roles and their permissions</p></div>
                <form onSubmit={searchRoles} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative flex-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div><input type="text" value={search} onChange={e => setSearch(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-coin-500 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-400 sm:text-sm transition duration-150 ease-in-out" placeholder="Search roles/permissions..." /></div>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div><input type="text" value={searchUser} onChange={e => setSearchUser(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-coin-500 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-400 sm:text-sm transition duration-150 ease-in-out" placeholder="Search users..." /></div>
                  <button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-coin-600 hover:bg-coin-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coin-500 transition-colors duration-200"><Search className="h-4 w-4 mr-2" />Search</button>
                </form>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {roles?.data?.length > 0 ? (roles.data.map((role) => (
                  <RoleCard key={role.id} role={role} permissions={permissions} users={userOptions} toggling={toggling} assigning={assigning} removing={removing} onTogglePermission={togglePermission} onAssignUser={assignUser} onRemoveUser={removeUser} onDelete={deleteRole} openConfirm={openConfirm} />
                ))) : (
                  <div className="text-center py-8"><Shield className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No roles found</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new role.</p></div>
                )}
              </div>

              {roles?.data && roles.data.length > 0 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button onClick={() => changePage(roles?.prev_page_url)} disabled={!roles?.prev_page_url} className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Previous
                    </button>
                    <button onClick={() => changePage(roles?.next_page_url)} disabled={!roles?.next_page_url} className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Next
                    </button>
                  </div>

                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{roles?.from ?? 0}</span> to <span className="font-medium">{roles?.to ?? 0}</span> of <span className="font-medium">{roles?.total ?? 0}</span> results
                      </p>
                    </div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button onClick={() => changePage(roles?.prev_page_url)} disabled={!roles?.prev_page_url} className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600">
                        Page {roles?.current_page ?? 1} of {roles?.last_page ?? 1}
                      </span>
                      <button onClick={() => changePage(roles?.next_page_url)} disabled={!roles?.next_page_url} className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={() => { setConfirmOpen(false); confirmAction(); }} onCancel={() => setConfirmOpen(false)} />
      </Suspense>
    </div>
  )
}

(Roles as any).layout = (page: any) => (
  <SuperAdminLayout title="Roles & Permissions" user={page.props?.auth?.user}>{page}</SuperAdminLayout>
)
