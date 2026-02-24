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
  MapPin, Users, AlertTriangle, CheckCircle, Zap, Moon, Sun
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

interface Zone {
  id: number;
  name: string;
  supervisor_count: number;
  guard_count: number;
  status: string;
}

interface DownResolution {
  id: number;
  guard_name: string;
  site_name: string;
  resolved_at: string;
  incentive_preserved: boolean;
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  zones: Zone[];
  recent_resolutions: DownResolution[];
  stats: {
    total_zones: number;
    active_supervisors: number;
    total_guards: number;
    downs_resolved_today: number;
    incentives_preserved: number;
  };
}

export default function ZoneCommanderProfile() {
  const { user, zones, recent_resolutions, stats } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, downs: true, zone_alerts: true });

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Zone Commander Profile" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Zone Commander Dashboard & Account Settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="zones">My Zones</TabsTrigger>
            <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Zones</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total_zones}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Supervisors</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.active_supervisors}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Total Guards</p><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.total_guards}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Resolved Today</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.downs_resolved_today}</p></CardContent></Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-green-500">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Zap className="h-5 w-5 text-green-500" />Incentive Impact</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">You have preserved <strong className="text-green-600 dark:text-green-400">{stats.incentives_preserved}</strong> supervisor/sergeant incentives this month by resolving guard downs promptly. Zone commander resolutions do not count against supervisor incentives.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-purple-600 dark:text-purple-400 font-medium">Zone Commander</p>
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
                    <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Role</p><p className="text-gray-900 dark:text-gray-100">Zone Commander</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><MapPin className="h-5 w-5" />Assigned Zones</CardTitle></CardHeader>
              <CardContent>
                {zones.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No zones assigned</p> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map((zone) => (
                      <Card key={zone.id} className="dark:bg-gray-700/50 dark:border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{zone.name}</h4>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{zone.supervisor_count} supervisors</span>
                                <span className="flex items-center gap-1"><Shield className="h-4 w-4" />{zone.guard_count} guards</span>
                              </div>
                            </div>
                            <Badge className={zone.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>{zone.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolutions" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />Recent Down Resolutions</CardTitle></CardHeader>
              <CardContent>
                {recent_resolutions.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No recent resolutions</p> : (
                  <div className="space-y-3">
                    {recent_resolutions.map((resolution) => (
                      <div key={resolution.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${resolution.incentive_preserved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                            {resolution.incentive_preserved ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{resolution.guard_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{resolution.site_name} • {new Date(resolution.resolved_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <Badge className={resolution.incentive_preserved ? 'bg-green-500' : 'bg-yellow-500'}>{resolution.incentive_preserved ? 'Incentive Preserved' : 'Incentive Applied'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"><CardContent className="p-4"><p className="text-sm text-blue-900 dark:text-blue-200"><strong>Zone Commander Authority:</strong> When you resolve guard downs, the resolution is attributed to you. This means the down does NOT count against the supervisor's or sergeant's monthly incentive. Use this authority responsibly to help your team maintain their incentives.</p></CardContent></Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">Updates via email</p></div></div><Checkbox checked={notifications.email} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, email: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Down Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Guard down notifications in your zones</p></div></div><Checkbox checked={notifications.downs} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, downs: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Zone Alerts</p><p className="text-sm text-gray-500 dark:text-gray-400">Zone activity notifications</p></div></div><Checkbox checked={notifications.zone_alerts} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, zone_alerts: checked })} /></div>
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
                <Button className="bg-purple-600 hover:bg-purple-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
