import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import FrontOfficeLayout from '@/Layouts/FrontOfficeLayout';
import {
    User,
    Mail,
    Phone,
    Building2,
    Shield,
    Camera,
    Lock,
    Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { cn } from '@/lib/utils';

interface ProfileProps {
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        department: string | null;
        role: string;
        avatar?: string | null;
        created_at: string;
    };
    roleLabel: string;
}

export default function Profile({ user, roleLabel }: ProfileProps) {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        department: user.department || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        router.put(route('front-office.profile.update'), formData, {
            onFinish: () => setIsSaving(false),
        });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.password_confirmation) {
            alert('Passwords do not match');
            return;
        }
        router.post(route('front-office.password.update'), passwordData, {
            onSuccess: () => {
                setPasswordData({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
            },
        });
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <FrontOfficeLayout title="My Profile">
            <Head title="My Profile" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <User className="w-6 h-6 text-red-500" />
                    My Profile
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1 bg-card border-border h-fit">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        getInitials(user.name)
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <Camera className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-foreground">{user.name}</h2>
                            <span className={cn(
                                "mt-1 px-3 py-1 rounded-full text-xs font-medium border",
                                roleLabel === 'Executive Assistant' && "bg-red-500/20 text-red-400 border-red-500/30",
                                roleLabel === 'Personal Assistant' && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                                roleLabel === 'Receptionist' && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                                roleLabel === 'Super Admin' && "bg-green-500/20 text-green-400 border-green-500/30",
                                roleLabel === 'Administrator' && "bg-orange-500/20 text-orange-400 border-orange-500/30",
                            )}>
                                {roleLabel}
                            </span>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Member since {new Date(user.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{user.email}</span>
                            </div>
                            {user.phone && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground">{user.phone}</span>
                                </div>
                            )}
                            {user.department && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground">{user.department}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground capitalize">{user.role.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Tabs */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardContent className="p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-muted border-border">
                                <TabsTrigger value="general" className="data-[state=active]:bg-background">
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="password" className="data-[state=active]:bg-background">
                                    Password
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="mt-6">
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="bg-muted border-border text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="bg-muted border-border text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="bg-muted border-border text-foreground"
                                                placeholder="+265..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                value={formData.department}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                className="bg-muted border-border text-foreground"
                                                placeholder="e.g., Front Office"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="password" className="mt-6">
                                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password">Current Password</Label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="current_password"
                                                type="password"
                                                value={passwordData.current_password}
                                                onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                className="pl-10 bg-muted border-border text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={passwordData.password}
                                                onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                                className="pl-10 bg-muted border-border text-foreground"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                value={passwordData.password_confirmation}
                                                onChange={e => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                                                className="pl-10 bg-muted border-border text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </FrontOfficeLayout>
    );
}
