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
  MapPin, Clock, Calendar, CheckCircle, AlertTriangle, Moon, Sun
} from 'lucide-react';
import { useTheme } from '@/Providers/ThemeProvider';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  employee_id: string;
  created_at: string;
}

interface Assignment {
  id: number;
  site_name: string;
  client_name: string;
  shift: string;
  status: string;
  start_date: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  check_in?: string;
  check_out?: string;
}

interface ProfilePageProps extends PageProps {
  user: UserData;
  current_assignment: Assignment | null;
  attendance: AttendanceRecord[];
  stats: {
    days_worked_this_month: number;
    total_shifts: number;
    on_time_percentage: number;
  };
}

export default function GuardProfile() {
  const { user, current_assignment, attendance, stats } = usePage<ProfilePageProps>().props;
  const { theme, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, phone: user.phone || '' });
  const [notifications, setNotifications] = useState({ email: true, shift_reminders: true, payroll: true });

  const handleSaveProfile = () => {
    router.patch(route('profile.update'), formData, { onSuccess: () => setIsEditing(false) });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'on_leave': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="My Profile" />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Guard Dashboard & Account Settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Days This Month</p><p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.days_worked_this_month}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">Total Shifts</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.total_shifts}</p></CardContent></Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700"><CardContent className="p-4"><p className="text-xs text-gray-600 dark:text-gray-400">On-Time %</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.on_time_percentage}%</p></CardContent></Card>
            </div>

            {current_assignment && (
              <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-green-500">
                <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><MapPin className="h-5 w-5 text-green-500" />Current Assignment</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{current_assignment.site_name}</p>
                    <p className="text-gray-600 dark:text-gray-400">{current_assignment.client_name}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge className="bg-blue-500">{current_assignment.shift}</Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Started: {new Date(current_assignment.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl font-bold text-green-600 dark:text-green-200">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="h-20 w-20 rounded-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">Security Guard</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">ID: {user.employee_id} • Member since {new Date(user.created_at).toLocaleDateString()}</p>
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
                    <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Email</p><p className="text-gray-900 dark:text-gray-100">{user.email}</p></div></div>
                    <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Phone</p><p className="text-gray-900 dark:text-gray-100">{user.phone || 'Not set'}</p></div></div>
                    <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">Employee ID</p><p className="text-gray-900 dark:text-gray-100">{user.employee_id}</p></div></div>
                    <div className="flex items-center gap-3"><User className="h-5 w-5 text-gray-400" /><div><p className="text-sm text-gray-600 dark:text-gray-400">User ID</p><p className="text-gray-900 dark:text-gray-100">#{user.id}</p></div></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignment" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><MapPin className="h-5 w-5" />Assignment Details</CardTitle></CardHeader>
              <CardContent>
                {current_assignment ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Site</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{current_assignment.site_name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{current_assignment.client_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-600 dark:text-gray-400">Shift</p><p className="font-semibold text-gray-900 dark:text-gray-100">{current_assignment.shift}</p></div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p><p className="font-semibold text-gray-900 dark:text-gray-100">{new Date(current_assignment.start_date).toLocaleDateString()}</p></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No active assignment</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader><CardTitle className="dark:text-gray-100 flex items-center gap-2"><Clock className="h-5 w-5" />Recent Attendance</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? <p className="text-gray-600 dark:text-gray-400 text-center py-8">No attendance records</p> : (
                  <div className="space-y-3">
                    {attendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg"><Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" /></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(record.date).toLocaleDateString()}</p>
                            {record.check_in && <p className="text-sm text-gray-500 dark:text-gray-400">Check-in: {record.check_in}</p>}
                          </div>
                        </div>
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
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
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Shift Reminders</p><p className="text-sm text-gray-500 dark:text-gray-400">Upcoming shift alerts</p></div></div><Checkbox checked={notifications.shift_reminders} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, shift_reminders: checked })} /></div>
                <div className="border-t dark:border-gray-700" />
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-gray-400" /><div><p className="font-medium text-gray-900 dark:text-gray-100">Payroll Updates</p><p className="text-sm text-gray-500 dark:text-gray-400">Salary and payment notifications</p></div></div><Checkbox checked={notifications.payroll} onCheckedChange={(checked: boolean) => setNotifications({ ...notifications, payroll: checked })} /></div>
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
                <Button className="bg-green-600 hover:bg-green-700"><Lock className="h-4 w-4 mr-2" />Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
