import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { useTheme } from '@/Providers/ThemeProvider';
import {
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    Edit3,
    Save,
    X,
    Eye,
    EyeOff,
    Bell,
    Palette,
    Activity,
    DollarSign,
    MapPin,
    ClipboardList,
    Users,
    Building2,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Award,
    Settings,
    Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import PushNotificationSettings from '@/Components/Common/PushNotificationSettings';

// Types
interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: string;
    created_at: string;
}

type Stats = { [key: string]: number | undefined | string };

interface Incentive {
    id: number;
    amount: number;
    reason: string;
    date: string;
    status: string;
}

interface Assignment {
    id: number;
    site_name: string;
    site_address: string;
    shift: string;
    status: string;
    start_date: string;
}

interface Zone {
    id: number;
    name: string;
    site_count: number;
    guard_count: number;
    status: string;
}

interface Resolution {
    id: number;
    down_id: number;
    resolved_at: string;
    resolution_time: string;
    status: string;
}

interface AttendanceRecord {
    id: number;
    date: string;
    check_in: string;
    check_out: string | null;
    site_name: string;
    status: string;
    hours_worked?: number;
}

interface ActivityItem {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    icon?: string;
}

interface ProfilePageProps {
    user: User;
    stats?: Stats;
    incentives?: Incentive[];
    assignments?: Assignment[];
    zones?: Zone[];
    resolutions?: Resolution[];
    attendance?: AttendanceRecord[];
    activity?: ActivityItem[];
    isSergeant?: boolean;
    roleLabel?: string;
    updateRoute?: string;
    passwordRoute?: string;
    notificationOptions?: { key: string; label: string; defaultChecked: boolean }[];
    tabs?: string[];
    pageTitle?: string;
    renderLayout: (children: React.ReactNode) => React.ReactNode;
}

// Role-specific section components
const StatsSection: React.FC<{ stats: Stats; title?: string }> = ({ stats, title = 'Statistics' }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(stats).map(([key, value]) => (
            <Card key={key} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{value ?? 0}</p>
                </CardContent>
            </Card>
        ))}
    </div>
);

const IncentivesSection: React.FC<{ incentives: Incentive[] }> = ({ incentives }) => (
    <div className="space-y-3">
        {incentives.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No incentives recorded</p>
                </CardContent>
            </Card>
        ) : (
            incentives.map((incentive) => (
                <Card key={incentive.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-medium text-white truncate">{incentive.reason}</p>
                            <p className="text-xs sm:text-sm text-slate-400">{incentive.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={incentive.status === 'approved' ? 'success' : 'secondary'}>
                                {incentive.status}
                            </Badge>
                            <span className="font-bold text-green-400">K{incentive.amount.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

const AssignmentsSection: React.FC<{ assignments: Assignment[] }> = ({ assignments }) => (
    <div className="space-y-3">
        {assignments.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No active assignments</p>
                </CardContent>
            </Card>
        ) : (
            assignments.map((assignment) => (
                <Card key={assignment.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium text-white truncate">{assignment.site_name}</p>
                                <p className="text-xs sm:text-sm text-slate-400 truncate">{assignment.site_address}</p>
                                <p className="text-xs sm:text-sm text-slate-400">Started: {assignment.start_date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={assignment.status === 'active' ? 'success' : 'secondary'}>
                                    {assignment.status}
                                </Badge>
                                <span className="text-xs sm:text-sm text-slate-300">{assignment.shift}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

const ZonesSection: React.FC<{ zones: Zone[] }> = ({ zones }) => (
    <div className="space-y-3">
        {zones.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No zones assigned</p>
                </CardContent>
            </Card>
        ) : (
            zones.map((zone) => (
                <Card key={zone.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-medium text-white truncate">{zone.name}</p>
                            <p className="text-xs sm:text-sm text-slate-400">
                                {zone.site_count} sites · {zone.guard_count} guards
                            </p>
                        </div>
                        <Badge variant={zone.status === 'active' ? 'success' : 'secondary'}>
                            {zone.status}
                        </Badge>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

const ResolutionsSection: React.FC<{ resolutions: Resolution[] }> = ({ resolutions }) => (
    <div className="space-y-3">
        {resolutions.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No resolutions recorded</p>
                </CardContent>
            </Card>
        ) : (
            resolutions.map((resolution) => (
                <Card key={resolution.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-medium text-white">Down #{resolution.down_id}</p>
                            <p className="text-xs sm:text-sm text-slate-400">
                                Resolved: {resolution.resolved_at}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="success">{resolution.status}</Badge>
                            <span className="text-xs sm:text-sm text-slate-300">{resolution.resolution_time}</span>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

const AttendanceSection: React.FC<{ attendance: AttendanceRecord[] }> = ({ attendance }) => (
    <div className="space-y-3">
        {attendance.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No attendance records</p>
                </CardContent>
            </Card>
        ) : (
            attendance.map((record) => (
                <Card key={record.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium text-white truncate">{record.site_name}</p>
                                <p className="text-xs sm:text-sm text-slate-400">{record.date}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={record.status === 'present' ? 'success' : 'secondary'}>
                                    {record.status}
                                </Badge>
                                <span className="text-xs sm:text-sm text-slate-300">
                                    {record.check_in} - {record.check_out ?? 'Active'}
                                </span>
                                {record.hours_worked && (
                                    <span className="text-xs sm:text-sm text-slate-400">
                                        ({record.hours_worked}h)
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

const ActivitySection: React.FC<{ activity: ActivityItem[] }> = ({ activity }) => (
    <div className="space-y-3">
        {activity.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                    <Activity className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                    <p className="text-slate-400">No recent activity</p>
                </CardContent>
            </Card>
        ) : (
            activity.map((item) => (
                <Card key={item.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                        <div className="p-2 rounded-full bg-slate-700">
                            <Activity className="h-4 w-4 text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-white">{item.action}</p>
                            <p className="text-xs sm:text-sm text-slate-400">{item.description}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
    </div>
);

// Main ProfilePage Component
const ProfilePage: React.FC<ProfilePageProps> = ({
    user,
    stats = {},
    incentives = [],
    assignments = [],
    zones = [],
    resolutions = [],
    attendance = [],
    activity = [],
    isSergeant = false,
    roleLabel,
    updateRoute = 'profile.update',
    passwordRoute = 'password.update',
    notificationOptions = [
        { key: 'email', label: 'Email notifications', defaultChecked: true },
        { key: 'security', label: 'Security alerts', defaultChecked: true },
    ],
    tabs = ['overview', 'settings'],
    pageTitle = 'Profile',
    renderLayout,
}) => {
    const { theme, toggle } = useTheme();
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        phone: user.phone ?? '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        notificationOptions.forEach((opt) => {
            initial[opt.key] = opt.defaultChecked;
        });
        return initial;
    });

    const displayRole = roleLabel ?? (isSergeant ? 'Sergeant' : user.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

    const handleSaveProfile = () => {
        setIsSaving(true);
        router.patch(route(updateRoute), formData, {
            onFinish: () => {
                setIsSaving(false);
                setIsEditing(false);
            },
        });
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        if (passwordData.password.length < 8) {
            setPasswordErrors({ password: 'Password must be at least 8 characters' });
            return;
        }
        if (passwordData.password !== passwordData.password_confirmation) {
            setPasswordErrors({ password_confirmation: 'Passwords do not match' });
            return;
        }

        router.put(route(passwordRoute), passwordData, {
            onSuccess: () => {
                setPasswordData({ current_password: '', password: '', password_confirmation: '' });
            },
            onError: (errors) => {
                setPasswordErrors(errors);
            },
        });
    };

    const handleNotificationChange = (key: string, checked: boolean) => {
        setNotifications((prev) => ({ ...prev, [key]: checked }));
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderTabContent = (tab: string) => {
        switch (tab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Stats */}
                        {Object.keys(stats).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                                <StatsSection stats={stats} />
                            </div>
                        )}

                        {/* Activity */}
                        {activity.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
                                <ActivitySection activity={activity} />
                            </div>
                        )}

                        {/* Empty state if no stats or activity */}
                        {Object.keys(stats).length === 0 && activity.length === 0 && (
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardContent className="p-6 text-center">
                                    <User className="h-12 w-12 mx-auto text-slate-500 mb-2" />
                                    <p className="text-slate-400">Welcome to your profile</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 'earnings':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Earnings & Incentives</h3>
                        <IncentivesSection incentives={incentives} />
                    </div>
                );

            case 'incentives':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Incentive History</h3>
                        <IncentivesSection incentives={incentives} />
                    </div>
                );

            case 'assignments':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Site Assignments</h3>
                        <AssignmentsSection assignments={assignments} />
                    </div>
                );

            case 'zones':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">My Zones</h3>
                        <ZonesSection zones={zones} />
                    </div>
                );

            case 'resolutions':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Down Resolutions</h3>
                        <ResolutionsSection resolutions={resolutions} />
                    </div>
                );

            case 'attendance':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Attendance Records</h3>
                        <AttendanceSection attendance={attendance} />
                    </div>
                );

            case 'system':
                return (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">System Statistics</h3>
                        <StatsSection stats={stats} title="System Overview" />
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-6">
                        {/* Push Notifications */}
                        <PushNotificationSettings />

                        {/* Notification Preferences */}
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Bell className="h-5 w-5" />
                                    Notification Preferences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {notificationOptions.map((option) => (
                                    <div key={option.key} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`notification-${option.key}`}
                                            checked={notifications[option.key]}
                                            onCheckedChange={(checked) =>
                                                handleNotificationChange(option.key, checked as boolean)
                                            }
                                        />
                                        <Label htmlFor={`notification-${option.key}`} className="text-slate-300">
                                            {option.label}
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Appearance */}
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Palette className="h-5 w-5" />
                                    Appearance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Dark Mode</p>
                                        <p className="text-sm text-slate-400">Toggle dark/light theme</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggle}
                                        className="border-slate-600 text-slate-300"
                                    >
                                        {theme === 'dark' ? 'On' : 'Off'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Password Change */}
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <Lock className="h-5 w-5" />
                                    Change Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password" className="text-slate-300">
                                            Current Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="current_password"
                                                type={showPassword.current ? 'text' : 'password'}
                                                value={passwordData.current_password}
                                                onChange={(e) =>
                                                    setPasswordData({ ...passwordData, current_password: e.target.value })
                                                }
                                                className="bg-slate-700 border-slate-600 text-white pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, current: !showPassword.current })
                                                }
                                            >
                                                {showPassword.current ? (
                                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-slate-400" />
                                                )}
                                            </Button>
                                        </div>
                                        {passwordErrors.current_password && (
                                            <p className="text-sm text-red-400">{passwordErrors.current_password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-slate-300">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword.new ? 'text' : 'password'}
                                                value={passwordData.password}
                                                onChange={(e) =>
                                                    setPasswordData({ ...passwordData, password: e.target.value })
                                                }
                                                className="bg-slate-700 border-slate-600 text-white pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                            >
                                                {showPassword.new ? (
                                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-slate-400" />
                                                )}
                                            </Button>
                                        </div>
                                        {passwordErrors.password && (
                                            <p className="text-sm text-red-400">{passwordErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-slate-300">
                                            Confirm New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showPassword.confirm ? 'text' : 'password'}
                                                value={passwordData.password_confirmation}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        password_confirmation: e.target.value,
                                                    })
                                                }
                                                className="bg-slate-700 border-slate-600 text-white pr-10"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                                                }
                                            >
                                                {showPassword.confirm ? (
                                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-slate-400" />
                                                )}
                                            </Button>
                                        </div>
                                        {passwordErrors.password_confirmation && (
                                            <p className="text-sm text-red-400">{passwordErrors.password_confirmation}</p>
                                        )}
                                    </div>

                                    <Button type="submit" className="w-full sm:w-auto">
                                        Update Password
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderLayout(
                <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
                {/* Profile Header Card */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-red-900 text-white text-xl sm:text-2xl">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0 w-full">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-slate-300">
                                                Name
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-300">
                                                Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="bg-slate-700 border-slate-600 text-white"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleSaveProfile} disabled={isSaving} size="sm">
                                                <Save className="h-4 w-4 mr-2" />
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({ name: user.name, phone: user.phone ?? '' });
                                                }}
                                                size="sm"
                                                className="border-slate-600 text-slate-300"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                                                {user.name}
                                            </h1>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                                className="opacity-70 hover:opacity-100"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Badge className="bg-red-900 text-white mb-2">{displayRole}</Badge>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-4 w-4" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full overflow-x-auto flex-nowrap justify-start sm:justify-center bg-slate-800/50 border-slate-700 p-1">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="capitalize data-[state=active]:bg-red-900 data-[state=active]:text-white text-slate-300 whitespace-nowrap"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {tabs.map((tab) => (
                        <TabsContent key={tab} value={tab} className="mt-4">
                            {renderTabContent(tab)}
                        </TabsContent>
                    ))}
                </Tabs>
                </div>
            )}
        </>
    );
};

export default ProfilePage;
