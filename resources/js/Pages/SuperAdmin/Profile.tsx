import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Checkbox } from '@/Components/ui/checkbox';
import { PageProps } from '@/types';
import { 
  User, Mail, Phone, Shield, Lock, Save,
  Server, Users, Activity, Settings, Moon, Sun
} from 'lucide-react';
import { useTheme } from '@/Providers/ThemeProvider';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

interface SystemStats {
  total_users: number;
  active_modules: number;
  system_status: string;
  last_backup: string;
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  stats: SystemStats;
}

export default function SuperAdminProfile() {
  const { user, stats } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, system: true, security: true });

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Super Admin Profile" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Super Administrator Dashboard</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_users}</p></div><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-gray-400">Active Modules</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active_modules}</p></div><div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full"><Server className="h-6 w-6 text-green-600 dark:text-green-400" /></div></div></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600 dark:text-gray-400">System Status</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.system_status}</p></div><div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full"><Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div></div></CardContent></Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-medium">Super Administrator</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="dark:border-gray-600 dark:text-gray-200">{isEditing ? 'Cancel' : 'Edit Profile'}</Button>
                </div>
                <div className="border-t dark:border-gray-700" />
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="dark:text-gray-200">Full Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                      <div className="space-y-2"><Label className="dark:text-gray-200">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-indigo-600 hover:bg-indigo-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="text-gray-900 dark:text-gray-100">Super Admin</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Server className="h-5 w-5" />System Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-600 dark:text-gray-400">Last Backup</p><p className="font-medium text-gray-900 dark:text-gray-100">{stats.last_backup}</p></div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-600 dark:text-gray-400">System Version</p><p className="font-medium text-gray-900 dark:text-gray-100">v2.0.0</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">System alerts via email</p></div></div><Checkbox checked={notifications.email} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Server className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">System Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Server status notifications</p></div></div><Checkbox checked={notifications.system} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, system: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Security Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Security-related notifications</p></div></div><Checkbox checked={notifications.security} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, security: checked })} /></div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Appearance</CardTitle></CardHeader>
              <CardContent><div className="flex items-center justify-between"><div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-5 w-5 text-gray-400" /> : <Sun className="h-5 w-5 text-gray-400" />}<div><p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p><p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p></div></div><Checkbox checked={theme === 'dark'} onCheckedChange={toggle} /></div></CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label className="dark:text-gray-200">Current Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <div className="space-y-2"><Label className="dark:text-gray-200">New Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <div className="space-y-2"><Label className="dark:text-gray-200">Confirm Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <Button className="bg-indigo-600 hover:bg-indigo-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
