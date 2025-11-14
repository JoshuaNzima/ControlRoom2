<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    public function index()
    {
        $q = request()->get('q');
        $qUser = request()->get('q_user');

        $roles = Role::with('permissions', 'users')
            ->when($q, function ($query, $q) {
                $query->where('name', 'like', "%{$q}%");
            })
            ->orderBy('name')
            ->paginate(15)
            ->appends(request()->query());

        $permissions = Permission::when($q, function ($query, $q) {
                $query->where('name', 'like', "%{$q}%");
            })
            ->orderBy('name')
            ->paginate(30)
            ->appends(request()->query());

        $users = User::select('id','name','email')
            ->when($qUser, function ($query, $qUser) {
                $query->where('name', 'like', "%{$qUser}%")->orWhere('email', 'like', "%{$qUser}%");
            })
            ->orderBy('name')
            ->paginate(50)
            ->appends(request()->query());

        return Inertia::render('SuperAdmin/Roles', [
            'roles' => $roles,
            'permissions' => $permissions,
            'users' => $users,
            'auth' => [ 'user' => [ 'name' => auth()->user()->name ] ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function storeRole(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $role = Role::firstOrCreate(['name' => $request->name]);
        return redirect()->back()->with('success', 'Role created');
    }

    public function deleteRole(Role $role)
    {
        if (in_array($role->name, ['admin', 'super_admin'])) {
            return back()->with('error', 'Cannot delete core roles');
        }
        $role->delete();
        return back()->with('success', 'Role deleted');
    }

    public function storePermission(Request $request)
    {
        $request->validate(['name' => 'required|string|max:150']);
        Permission::firstOrCreate(['name' => $request->name, 'guard_name' => 'web']);
        return back()->with('success', 'Permission created');
    }

    public function deletePermission(Permission $permission)
    {
        if (in_array($permission->name, ['admin.roles.manage'])) {
            return back()->with('error', 'Cannot delete core permission');
        }
        $permission->delete();
        return back()->with('success', 'Permission deleted');
    }

    public function togglePermission(Request $request, Role $role)
    {
        $request->validate(['permission' => 'required|string']);
        $permName = $request->permission;
        $permission = Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        if ($role->hasPermissionTo($permission)) {
            $role->revokePermissionTo($permission);
        } else {
            $role->givePermissionTo($permission);
        }
        return back();
    }

    public function assignUser(Request $request, Role $role)
    {
        $request->validate(['user_id' => 'required|integer']);
        $user = User::find($request->user_id);
        if (! $user) {
            return back()->with('error', 'User not found');
        }
        $user->assignRole($role->name);
        return back()->with('success', "Assigned role {$role->name} to {$user->name}");
    }

    public function removeUser(Request $request, Role $role)
    {
        $request->validate(['user_id' => 'required|integer']);
        $user = User::find($request->user_id);
        if (! $user) {
            return back()->with('error', 'User not found');
        }
        $user->removeRole($role->name);
        return back()->with('success', "Removed role {$role->name} from {$user->name}");
    }
}
