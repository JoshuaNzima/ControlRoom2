import React, { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import ConfirmModal from '@/Components/ConfirmModal';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

const Roles = (props: any) => {
    const { roles = {}, permissions = {}, users = {}, flash = {} } = props;

    const roleForm = useForm({ name: '' });
    const permissionForm = useForm({ name: '' });
    const [rolesState, setRolesState] = useState<any>(roles);
    useEffect(() => setRolesState(roles), [roles]);
    const [search, setSearch] = useState('');
    const [searchUser, setSearchUser] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const openConfirm = (title: string, message: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const createRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleForm.data.name.trim()) return roleForm.setErrors({ name: 'Please enter a role name' });
        roleForm.post('/superadmin/roles', {
            preserveState: false,
            onSuccess: () => roleForm.reset('name'),
        });
    };

    const deleteRole = (roleId: number, roleName: string) => {
        openConfirm('Delete Role', `Delete role ${roleName}? This cannot be undone.`, () => {
            router.delete(`/superadmin/roles/${roleId}`);
        });
    };

    const createPermission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!permissionForm.data.name.trim()) return permissionForm.setErrors({ name: 'Please enter a permission name' });
        permissionForm.post('/superadmin/permissions', {
            onSuccess: () => permissionForm.reset('name'),
        });
    };

    const deletePermission = (permissionId: number, name: string) => {
        openConfirm('Delete Permission', `Delete permission ${name}? This cannot be undone.`, () => {
            router.delete(`/superadmin/permissions/${permissionId}`);
        });
    };

    const togglePermission = (roleId: number, permName: string) => {
        // optimistic update
        const previous = JSON.parse(JSON.stringify(rolesState));
        const newRoles = JSON.parse(JSON.stringify(rolesState));
        const role = newRoles?.data?.find((r: any) => r.id === roleId);
        if (!role) return;
        const has = role.permissions?.some((p: any) => p.name === permName);
        if (has) {
            role.permissions = role.permissions.filter((p: any) => p.name !== permName);
        } else {
            role.permissions = [...(role.permissions || []), { id: permName, name: permName }];
        }
        setRolesState(newRoles);

        router.post(`/superadmin/roles/${roleId}/toggle-permission`, { permission: permName }, {
            onError: () => setRolesState(previous),
        });
    };

    const assignUser = (roleId: number, userId: number) => {
        if (!userId) return;
        const previous = JSON.parse(JSON.stringify(rolesState));
        const newRoles = JSON.parse(JSON.stringify(rolesState));
        const role = newRoles?.data?.find((r: any) => r.id === roleId);
        const userObj = users?.data?.find((u: any) => u.id === userId) || { id: userId, name: 'Unknown' };
        if (!role) return;
        // avoid duplicates
        if (!role.users?.some((u: any) => u.id === userId)) {
            role.users = [...(role.users || []), userObj];
            setRolesState(newRoles);
        }

        router.post(`/superadmin/roles/${roleId}/assign-user`, { user_id: userId }, {
            onError: () => setRolesState(previous),
        });
    };

    const removeUser = (roleId: number, userId: number) => {
        openConfirm('Remove Role', 'Remove this role from the user?', () => {
            const previous = JSON.parse(JSON.stringify(rolesState));
            const newRoles = JSON.parse(JSON.stringify(rolesState));
            const role = newRoles?.data?.find((r: any) => r.id === roleId);
            if (!role) return;
            role.users = (role.users || []).filter((u: any) => u.id !== userId);
            setRolesState(newRoles);

            router.post(`/superadmin/roles/${roleId}/remove-user`, { user_id: userId }, {
                onError: () => setRolesState(previous),
            });
        });
    };

    const changePage = (pageUrl: string | null) => {
        if (!pageUrl) return;
        router.get(pageUrl);
    };

    const searchRoles = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/superadmin/roles', { q: search, q_user: searchUser }, { only: ['roles', 'permissions', 'users', 'flash'] });
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                <div className="text-sm text-gray-600">Page {roles?.current_page ?? 1} of {roles?.last_page ?? 1}</div>
            </div>

            {flash?.success && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{flash.success}</div>}
            {flash?.error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{flash.error}</div>}

            <div className="mb-4 grid grid-cols-3 gap-6">
                <div className="col-span-3 md:col-span-1 bg-white shadow rounded p-4">
                    <h2 className="font-semibold mb-3">Create Role</h2>
                    <form onSubmit={createRole} className="flex gap-2 flex-col">
                        <label className="text-sm">Role Name</label>
                        <input value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} className="border rounded px-2 py-2" placeholder="e.g. finance_officer" />
                        {roleForm.errors.name && <div className="text-red-600 text-sm">{roleForm.errors.name}</div>}
                        <div className="flex justify-end">
                            <button disabled={roleForm.processing} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">{roleForm.processing ? 'Creating...' : 'Create Role'}</button>
                        </div>
                    </form>

                    <h2 className="font-semibold mt-6 mb-3">Create Permission</h2>
                    <form onSubmit={createPermission} className="flex gap-2 flex-col">
                        <label className="text-sm">Permission Name</label>
                        <input value={permissionForm.data.name} onChange={e => permissionForm.setData('name', e.target.value)} className="border rounded px-2 py-2" placeholder="e.g. finance.view" />
                        {permissionForm.errors.name && <div className="text-red-600 text-sm">{permissionForm.errors.name}</div>}
                        <div className="flex justify-end">
                            <button disabled={permissionForm.processing} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">{permissionForm.processing ? 'Creating...' : 'Create Permission'}</button>
                        </div>
                    </form>
                </div>

                <div className="col-span-3 md:col-span-2 bg-white shadow rounded p-4">
                    <div className="mb-4 flex gap-3">
                        <form onSubmit={searchRoles} className="flex gap-2 flex-1">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles/permissions" className="border rounded px-3 py-2 flex-1" />
                            <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search users by name or email" className="border rounded px-3 py-2 w-64" />
                            <button className="bg-gray-800 text-white px-3 py-2 rounded">Search</button>
                        </form>
                    </div>

                    <div className="space-y-3">
                        {roles?.data?.map((r: any) => (
                            <div key={r.id} className="border rounded p-4">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                    <div>
                                        <div className="font-medium text-lg">{r.name}</div>
                                        <div className="text-sm text-gray-600">Permissions: {r.permissions?.length ?? 0} — Users: {r.users?.length ?? 0}</div>
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <button onClick={() => deleteRole(r.id, r.name)} className="text-red-600">Delete</button>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-sm font-semibold mb-2">Permissions</div>
                                    <div className="flex flex-wrap gap-2">
                                        {permissions?.data?.map((p: any) => (
                                            <label key={p.id} className="inline-flex items-center gap-2 text-sm bg-gray-50 border rounded px-2 py-1">
                                                <input type="checkbox" checked={r.permissions?.some((rp: any) => rp.name === p.name)} onChange={() => togglePermission(r.id, p.name)} />
                                                <span>{p.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-sm font-semibold mb-2">Users</div>
                                    <div className="flex gap-2 items-center mb-3">
                                        <select onChange={e => assignUser(r.id, Number(e.target.value))} className="border rounded px-3 py-2">
                                            <option value="">Assign user...</option>
                                            {users?.data?.map((u: any) => (
                                                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {r.users?.map((u: any) => (
                                            <div key={u.id} className="px-3 py-1 border rounded text-sm inline-flex items-center gap-2">
                                                <span>{u.name}</span>
                                                <button onClick={() => removeUser(r.id, u.id)} className="text-red-600 text-sm">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">Showing {roles?.from ?? 1} - {roles?.to ?? (roles?.data?.length ?? 0)} of {roles?.total ?? (roles?.data?.length ?? 0)}</div>
                        <div className="flex gap-2">
                            <button disabled={!roles?.prev_page_url} onClick={() => changePage(roles?.prev_page_url)} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
                            <button disabled={!roles?.next_page_url} onClick={() => changePage(roles?.next_page_url)} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={() => { setConfirmOpen(false); confirmAction(); }} onCancel={() => setConfirmOpen(false)} />
        </div>
    );
};

Roles.layout = (page: any) => <SuperAdminLayout title="Roles & Permissions" user={page.props?.auth?.user}>{page}</SuperAdminLayout>;

export default Roles;

import React, { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import ConfirmModal from '@/Components/ConfirmModal';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';

const Roles = (props: any) => {
    const { roles = {}, permissions = {}, users = {}, flash = {} } = props;
    const { props: pageProps } = usePage();

    const roleForm = useForm({ name: '' });
    const permissionForm = useForm({ name: '' });
    const [search, setSearch] = useState('');
    const [searchUser, setSearchUser] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');

    const openConfirm = (title: string, message: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const createRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleForm.data.name.trim()) return roleForm.setErrors({ name: 'Please enter a role name' });
        roleForm.post('/superadmin/roles', {
            preserveState: false,
            return (
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                        <div className="text-sm text-gray-600">Page {roles?.current_page ?? 1} of {roles?.last_page ?? 1}</div>
                    </div>

                    {flash?.success && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{flash.success}</div>}
                    {flash?.error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{flash.error}</div>}

                    <div className="mb-4 grid grid-cols-3 gap-6">
                        <div className="col-span-3 md:col-span-1 bg-white shadow rounded p-4">
                            <h2 className="font-semibold mb-3">Create Role</h2>
                            <form onSubmit={createRole} className="flex gap-2 flex-col">
                                <label className="text-sm">Role Name</label>
                                <input value={roleForm.data.name} onChange={e => roleForm.setData('name', e.target.value)} className="border rounded px-2 py-2" placeholder="e.g. finance_officer" />
                                {roleForm.errors.name && <div className="text-red-600 text-sm">{roleForm.errors.name}</div>}
                                <div className="flex justify-end">
                                    <button disabled={roleForm.processing} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">{roleForm.processing ? 'Creating...' : 'Create Role'}</button>
                                </div>
                            </form>

                            <h2 className="font-semibold mt-6 mb-3">Create Permission</h2>
                            <form onSubmit={createPermission} className="flex gap-2 flex-col">
                                <label className="text-sm">Permission Name</label>
                                <input value={permissionForm.data.name} onChange={e => permissionForm.setData('name', e.target.value)} className="border rounded px-2 py-2" placeholder="e.g. finance.view" />
                                {permissionForm.errors.name && <div className="text-red-600 text-sm">{permissionForm.errors.name}</div>}
                                <div className="flex justify-end">
                                    <button disabled={permissionForm.processing} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">{permissionForm.processing ? 'Creating...' : 'Create Permission'}</button>
                                </div>
                            </form>
                        </div>

                        <div className="col-span-3 md:col-span-2 bg-white shadow rounded p-4">
                            <div className="mb-4 flex gap-3">
                                <form onSubmit={searchRoles} className="flex gap-2 flex-1">
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles/permissions" className="border rounded px-3 py-2 flex-1" />
                                    <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search users by name or email" className="border rounded px-3 py-2 w-64" />
                                    <button className="bg-gray-800 text-white px-3 py-2 rounded">Search</button>
                                </form>
                            </div>

                            <div className="space-y-3">
                                {roles?.data?.map((r: any) => (
                                    <div key={r.id} className="border rounded p-4">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                            <div>
                                                <div className="font-medium text-lg">{r.name}</div>
                                                <div className="text-sm text-gray-600">Permissions: {r.permissions?.length ?? 0} — Users: {r.users?.length ?? 0}</div>
                                            </div>
                                            <div className="flex gap-2 mt-3 md:mt-0">
                                                <button onClick={() => deleteRole(r.id, r.name)} className="text-red-600">Delete</button>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="text-sm font-semibold mb-2">Permissions</div>
                                            <div className="flex flex-wrap gap-2">
                                                {permissions?.data?.map((p: any) => (
                                                    <label key={p.id} className="inline-flex items-center gap-2 text-sm bg-gray-50 border rounded px-2 py-1">
                                                        <input type="checkbox" checked={r.permissions?.some((rp: any) => rp.name === p.name)} onChange={() => togglePermission(r.id, p.name)} />
                                                        <span>{p.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="text-sm font-semibold mb-2">Users</div>
                                            <div className="flex gap-2 items-center mb-3">
                                                <select onChange={e => assignUser(r.id, Number(e.target.value))} className="border rounded px-3 py-2">
                                                    <option value="">Assign user...</option>
                                                    {users?.data?.map((u: any) => (
                                                        <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {r.users?.map((u: any) => (
                                                    <div key={u.id} className="px-3 py-1 border rounded text-sm inline-flex items-center gap-2">
                                                        <span>{u.name}</span>
                                                        <button onClick={() => removeUser(r.id, u.id)} className="text-red-600 text-sm">Remove</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm text-gray-600">Showing {roles?.from ?? 1} - {roles?.to ?? (roles?.data?.length ?? 0)} of {roles?.total ?? (roles?.data?.length ?? 0)}</div>
                                <div className="flex gap-2">
                                    <button disabled={!roles?.prev_page_url} onClick={() => changePage(roles?.prev_page_url)} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
                                    <button disabled={!roles?.next_page_url} onClick={() => changePage(roles?.next_page_url)} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={() => { setConfirmOpen(false); confirmAction(); }} onCancel={() => setConfirmOpen(false)} />
                </div>
            );
        };

        Roles.layout = (page: any) => <SuperAdminLayout title="Roles & Permissions" user={page.props?.auth?.user}>{page}</SuperAdminLayout>;

        export default Roles;
                                    <div className="flex gap-2 items-center mb-2">
                                        <select onChange={e => assignUser(r.id, Number(e.target.value))} className="border rounded px-2 py-1">
                                            <option value="">Assign user...</option>
                                            {users?.data?.map((u: any) => (
                                                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {r.users?.map((u: any) => (
                                            <div key={u.id} className="px-2 py-1 border rounded text-sm inline-flex items-center gap-2">
                                                <span>{u.name}</span>
                                                <button onClick={() => removeUser(r.id, u.id)} className="text-red-600 text-sm">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">Page {roles?.current_page} of {roles?.last_page}</div>
                        <div className="flex gap-2">
                            <button onClick={() => changePage(roles?.prev_page_url)} className="px-2 py-1 border rounded">Prev</button>
                            <button onClick={() => changePage(roles?.next_page_url)} className="px-2 py-1 border rounded">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={() => { setConfirmOpen(false); confirmAction(); }} onCancel={() => setConfirmOpen(false)} />
        </div>
    );
};

export default Roles;
