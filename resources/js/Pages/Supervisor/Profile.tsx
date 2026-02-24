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
  TrendingUp, Users, MapPin, Calendar, Moon, Sun
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

interface Incentive {
  id: number;
  month: string;
  base_amount: number;
  penalties: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'paid';
  unresolved_downs: number;
}

interface Assignment {
  id: number;
  site_name: string;
  client_name: string;
  shift: string;
  status: string;
}

interface GuardStats {
  total_guards: number;
  active_guards: number;
  on_duty: number;
  issues_today: number;
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  incentives: { current: Incentive | null; history: Incentive[]; ytd_total: number };
  assignments: Assignment[];
  stats: GuardStats;
  isSergeant: boolean;
}

export default function SupervisorProfile() {
  const { user, incentives, assignments, stats, isSergeant } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, downs: true, incentives: true });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const roleTitle = isSergeant ? 'Sergeant' : 'Supervisor';

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title={`${roleTitle} Profile`} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{roleTitle} Dashboard & Account Settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incentives">Incentives</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Total Guards</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total_guards}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Active</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.active_guards}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">On Duty</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.on_duty}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Issues</p><p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.issues_today}</p></CardContent></Card>
            </div>

            {incentives.current && (
              <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-green-500">
                <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />Current Month Incentive</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Base Amount</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(incentives.current.base_amount)}</p></div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Penalties</p><p className="text-lg font-semibold text-red-600 dark:text-red-400">-{formatCurrency(incentives.current.penalties)}</p>{incentives.current.unresolved_downs > 0 && <p className="text-xs text-red-500">{incentives.current.unresolved_downs} unresolved downs</p>}</div>
                    <div><p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p><p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(incentives.current.final_amount)}</p><Badge className={incentives.current.status === 'paid' ? 'bg-green-500' : incentives.current.status === 'approved' ? 'bg-blue-500' : 'bg-yellow-500'}>{incentives.current.status}</Badge></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{roleTitle}</p>
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
                    <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="text-gray-900 dark:text-gray-100">{roleTitle}</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incentives" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center justify-between"><span className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Monthly Incentive History</span><span className="text-lg font-semibold text-green-600 dark:text-green-400">YTD: {formatCurrency(incentives.ytd_total)}</span></CardTitle></CardHeader>
              <CardContent>
                {incentives.history.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No incentive history available yet</p> : (
                  <div className="space-y-3">
                    {incentives.history.map((incentive) => (
                      <div key={incentive.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3">
                        <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">{incentive.month}</p><p className="text-sm text-gray-500 dark:text-gray-400">Base: {formatCurrency(incentive.base_amount)}{incentive.penalties > 0 && <span className="text-red-500 ml-2">- {formatCurrency(incentive.penalties)} penalties</span>}</p></div></div>
                        <div className="flex items-center gap-3"><span className="font-semibold text-lg text-green-600 dark:text-green-400">{formatCurrency(incentive.final_amount)}</span><Badge className={incentive.status === 'paid' ? 'bg-green-500' : incentive.status === 'approved' ? 'bg-blue-500' : 'bg-yellow-500'}>{incentive.status}</Badge></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"><CardContent className="p-4"><p className="text-sm text-blue-900 dark:text-blue-200"><strong>How incentives work:</strong> Monthly incentives are calculated based on your base amount minus penalties for unresolved guard downs. Only downs not resolved by zone commanders count against your incentive. Ensure your guards are always on duty and issues are resolved promptly.</p></CardContent></Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><MapPin className="h-5 w-5" />Site Assignments</CardTitle></CardHeader>
              <CardContent>
                {assignments.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No active site assignments</p> : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div><div><p className="font-medium text-gray-900 dark:text-gray-100">{assignment.site_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{assignment.client_name}</p><p className="text-xs text-gray-400 dark:text-gray-500">Shift: {assignment.shift}</p></div></div>
                        <Badge className={assignment.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>{assignment.status}</Badge>
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
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">Updates and alerts via email</p></div></div><Checkbox checked={notifications.email} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Guard Down Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Immediate alerts when guards are down</p></div></div><Checkbox checked={notifications.downs} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, downs: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Incentive Updates</p><p className="text-sm text-gray-500 dark:text-gray-400">Monthly incentive calculations</p></div></div><Checkbox checked={notifications.incentives} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, incentives: checked })} /></div>
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
                <Button className="bg-blue-600 hover:bg-blue-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
