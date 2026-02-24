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
  DollarSign, TrendingUp, Award, Moon, Sun
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

interface Commission {
  id: number;
  source: string;
  amount: number;
  status: 'pending' | 'claimed' | 'rejected';
  created_at: string;
  client_name?: string;
}

interface Incentive {
  id: number;
  month: string;
  base_amount: number;
  penalties: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'paid';
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  commissions: { pending: Commission[]; recent: Commission[]; total_claimed: number };
  incentives: { current: Incentive | null; history: Incentive[]; ytd_total: number };
  stats: { total_commissions: number; total_incentives: number; active_clients: number };
}

export default function AdminProfile() {
  const { user, commissions, incentives, stats } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, commissions: true, incentives: true });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  const claimCommission = (id: number) => {
    if (confirm('Claim this commission?')) router.post(route('profile.commissions.claim', id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="My Profile" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and view your earnings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Commissions</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_commissions)}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full"><DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Incentives (YTD)</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(incentives.ytd_total)}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full"><TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active_clients}</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full"><Award className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl font-bold text-red-600 dark:text-red-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">{user.role}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="dark:border-gray-600 dark:text-gray-200">{isEditing ? 'Cancel' : 'Edit Profile'}</Button>
                </div>

                <div className="border-t dark:border-gray-700" />

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="dark:text-gray-200">Full Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                      <div className="space-y-2"><Label className="dark:text-gray-200">Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                      <div className="space-y-2"><Label className="dark:text-gray-200">Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-red-600 hover:bg-red-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="text-gray-900 dark:text-gray-100 capitalize">{user.role}</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><DollarSign className="h-5 w-5" />Pending Commissions ({commissions.pending.length})</CardTitle></CardHeader>
              <CardContent>
                {commissions.pending.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-4">No pending commissions</p> : (
                  <div className="space-y-3">
                    {commissions.pending.map((commission) => (
                      <div key={commission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{commission.source}{commission.client_name && ` - ${commission.client_name}`}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(commission.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(commission.amount)}</span>
                          <Button size="sm" onClick={() => claimCommission(commission.id)} className="bg-green-600 hover:bg-green-700">Claim</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><TrendingUp className="h-5 w-5" />Monthly Incentives</CardTitle></CardHeader>
              <CardContent>
                {incentives.history.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-4">No incentive history available</p> : (
                  <div className="space-y-3">
                    {incentives.history.map((incentive) => (
                      <div key={incentive.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{incentive.month}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Base: {formatCurrency(incentive.base_amount)}{incentive.penalties > 0 && <span className="text-red-500"> - {formatCurrency(incentive.penalties)} penalties</span>}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(incentive.final_amount)}</span>
                          <Badge className={incentive.status === 'paid' ? 'bg-green-500' : incentive.status === 'approved' ? 'bg-blue-500' : 'bg-yellow-500'}>{incentive.status}</Badge>
                        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p></div></div>
                  <Checkbox checked={notifications.email} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })} />
                </div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Commission Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">New commission notifications</p></div></div>
                  <Checkbox checked={notifications.commissions} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, commissions: checked })} />
                </div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Incentive Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Monthly incentive updates</p></div></div>
                  <Checkbox checked={notifications.incentives} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, incentives: checked })} />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Appearance</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">{theme === 'dark' ? <Moon className="h-5 w-5 text-gray-400" /> : <Sun className="h-5 w-5 text-gray-400" />}<div><p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p><p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p></div></div>
                  <Checkbox checked={theme === 'dark'} onCheckedChange={toggle} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label className="dark:text-gray-200">Current Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <div className="space-y-2"><Label className="dark:text-gray-200">New Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <div className="space-y-2"><Label className="dark:text-gray-200">Confirm New Password</Label><Input type="password" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" /></div>
                <Button className="bg-red-600 hover:bg-red-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
