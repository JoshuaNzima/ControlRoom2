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
  Activity, Clock, CheckCircle, AlertCircle, Moon, Sun
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

interface ActivityLog {
  id: number;
  action: string;
  description: string;
  created_at: string;
  type: 'guard_assignment' | 'down_report' | 'client_update' | 'scan';
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  recent_activity: ActivityLog[];
  stats: {
    shifts_today: number;
    guards_assigned: number;
    downs_reported: number;
    scans_processed: number;
  };
}

export default function ControlRoomProfile() {
  const { user, recent_activity, stats } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, downs: true, assignments: true });

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'guard_assignment': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'down_report': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'client_update': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'scan': return <Activity className="h-5 w-5 text-purple-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Control Room Profile" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Control Room Operator Dashboard</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Shifts Today</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.shifts_today}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Guards Assigned</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.guards_assigned}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Downs Reported</p><p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.downs_reported}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Scans Processed</p><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.scans_processed}</p></CardContent></Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl font-bold text-orange-600 dark:text-orange-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-orange-600 dark:text-orange-400 font-medium">Control Room Operator</p>
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
                    <Button onClick={handleSaveProfile} className="bg-orange-600 hover:bg-orange-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="text-gray-900 dark:text-gray-100">Control Room</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Activity className="h-5 w-5" />Recent Activity</CardTitle></CardHeader>
              <CardContent>
                {recent_activity.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No recent activity</p> : (
                  <div className="space-y-3">
                    {recent_activity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{activity.action}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">Updates via email</p></div></div><Checkbox checked={notifications.email} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Down Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Guard down notifications</p></div></div><Checkbox checked={notifications.downs} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, downs: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Assignment Updates</p><p className="text-sm text-gray-500 dark:text-gray-400">Guard assignment changes</p></div></div><Checkbox checked={notifications.assignments} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, assignments: checked })} /></div>
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
                <Button className="bg-orange-600 hover:bg-orange-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
