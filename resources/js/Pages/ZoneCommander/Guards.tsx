import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';
import AssignSiteModal from '@/Components/Guards/AssignSiteModal';

interface Guard {
  id: number;
  name: string;
  employee_id: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended' | 'dismissed' | 'absconded';
  position: string;
  site_id: number | null;
  site_name: string;
  client_name: string;
  shift: 'day' | 'night' | 'rotating';
  performance_score: number;
  attendance_rate: number;
  last_check_in: string;
  risk_level: 'low' | 'medium' | 'high';
  certifications: string[];
  emergency_contact: string;
  emergency_phone: string;
  hire_date: string;
}

interface GuardsProps {
  guards: Guard[];
}

export default function Guards({ guards = [] }: GuardsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'dismissed' | 'absconded'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const [deployOpen, setDeployOpen] = useState(false);
  const [deployGuard, setDeployGuard] = useState<Guard | null>(null);

  const filteredGuards = guards.filter(guard => {
    const matchesSearch = guard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guard.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guard.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guard.site_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || guard.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || guard.risk_level === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'absconded':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100';
      case 'dismissed':
      case 'inactive':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-300';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-300';
    return 'text-red-600 dark:text-red-300';
  };

  const totalGuards = guards.length;
  const activeGuards = guards.filter(g => g.status === 'active').length;
  const onDutyGuards = guards.filter(g => g.status === 'active' && g.last_check_in).length;
  const averagePerformance = guards.length
    ? guards.reduce((sum, guard) => sum + guard.performance_score, 0) / guards.length
    : 0;

	return (
		<ZoneCommanderLayout title="Guards">
      <Head title="Guards Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="Shield" className="w-6 h-6 text-blue-600 dark:text-blue-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Guards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalGuards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="CheckCircle" className="w-6 h-6 text-green-600 dark:text-green-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Active Guards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeGuards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="Users" className="w-6 h-6 text-purple-600 dark:text-purple-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">On Duty</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{onDutyGuards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <IconMapper name="TrendingUp" className="w-6 h-6 text-orange-600 dark:text-orange-200" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Avg Performance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(averagePerformance)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="Shield" className="w-5 h-5" />
              Guard Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search guards by name, ID, email, or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('suspended')}
                  size="sm"
                >
                  Suspended
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
                <Button
                  variant={statusFilter === 'dismissed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('dismissed')}
                  size="sm"
                >
                  Dismissed
                </Button>
                <Button
                  variant={statusFilter === 'absconded' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('absconded')}
                  size="sm"
                >
                  Absconded
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={riskFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setRiskFilter('all')}
                  size="sm"
                >
                  All Risk
                </Button>
                <Button
                  variant={riskFilter === 'low' ? 'default' : 'outline'}
                  onClick={() => setRiskFilter('low')}
                  size="sm"
                >
                  Low Risk
                </Button>
                <Button
                  variant={riskFilter === 'high' ? 'default' : 'outline'}
                  onClick={() => setRiskFilter('high')}
                  size="sm"
                >
                  High Risk
                </Button>
                <Button
                  variant={riskFilter === 'medium' ? 'default' : 'outline'}
                  onClick={() => setRiskFilter('medium')}
                  size="sm"
                >
                  Medium Risk
                </Button>
              </div>
            </div>

            {/* Guards List */}
            <div className="space-y-4">
              {filteredGuards.map((guard) => (
                <Card key={guard.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{guard.name}</h3>
                          <Badge className={getStatusColor(guard.status)}>
                            {guard.status.toUpperCase()}
                          </Badge>
                          <Badge className={getRiskColor(guard.risk_level)}>
                            {guard.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                          <div className="flex items-center gap-2">
                            <IconMapper name="Hash" className="w-4 h-4" />
                            <span>ID: {guard.employee_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Mail" className="w-4 h-4" />
                            <span>{guard.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="MapPin" className="w-4 h-4" />
                            <span>{guard.site_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Building" className="w-4 h-4" />
                            <span>{guard.client_name}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Position</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.position}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Shift</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{guard.shift}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Performance</p>
                            <p className={`text-sm font-medium ${getPerformanceColor(guard.performance_score)}`}>
                              {guard.performance_score}%
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Attendance</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.attendance_rate}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Check-in</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {guard.last_check_in ? format(new Date(guard.last_check_in), 'MMM d, HH:mm') : 'Not checked in'}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Hire Date</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {format(new Date(guard.hire_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Emergency Contact</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{guard.emergency_contact}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {guard.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-gray-50 dark:hover:bg-gray-900"
                          onClick={() => {
                            setDeployGuard(guard);
                            setDeployOpen(true);
                          }}
                        >
                          <IconMapper name="MapPin" className="w-4 h-4 mr-2" />
                          Deploy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredGuards.length === 0 && (
              <div className="text-center py-12">
                <IconMapper name="Shield" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No guards found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AssignSiteModal
        open={deployOpen}
        guardId={deployGuard?.id ?? null}
        zones={[]}
        scope="zone"
        currentAssignment={deployGuard ? {
          site_id: deployGuard.site_id,
          site_name: deployGuard.site_name,
          client_name: deployGuard.client_name,
        } : null}
        onClose={() => { setDeployOpen(false); setDeployGuard(null); }}
        onSuccess={() => router.reload()}
      />

		</ZoneCommanderLayout>
	);
}


