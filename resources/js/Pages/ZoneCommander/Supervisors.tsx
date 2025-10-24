import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';

interface Supervisor {
  id: number;
  name: string;
  employee_id: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'on_leave';
  position: string;
  zone_name: string;
  team_size: number;
  performance_score: number;
  last_active: string;
  certifications: string[];
  emergency_contact: string;
  hire_date: string;
  shift: 'day' | 'night' | 'rotating';
}

interface SupervisorsProps {
  supervisors: Supervisor[];
}

export default function Supervisors({ supervisors = [] }: SupervisorsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'on_leave'>('all');

  const filteredSupervisors = supervisors.filter(supervisor => {
    const matchesSearch = supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supervisor.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supervisor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supervisor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalSupervisors = supervisors.length;
  const activeSupervisors = supervisors.filter(s => s.status === 'active').length;
  const totalTeamSize = supervisors.reduce((sum, s) => sum + s.team_size, 0);
  const averagePerformance = supervisors.reduce((sum, s) => sum + s.performance_score, 0) / supervisors.length;

  return (
    <ZoneCommanderLayout title="Supervisors">
      <Head title="Supervisors Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="UserCog" className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Supervisors</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSupervisors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="CheckCircle" className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Supervisors</p>
                  <p className="text-2xl font-bold text-gray-900">{activeSupervisors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="Users" className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Team Size</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTeamSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="TrendingUp" className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Performance</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(averagePerformance)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="UserCog" className="w-5 h-5" />
              Supervisor Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search supervisors by name, ID, or email..."
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
                  variant={statusFilter === 'on_leave' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('on_leave')}
                  size="sm"
                >
                  On Leave
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                  size="sm"
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Supervisors List */}
            <div className="space-y-4">
              {filteredSupervisors.map((supervisor) => (
                <Card key={supervisor.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{supervisor.name}</h3>
                          <Badge className={getStatusColor(supervisor.status)}>
                            {supervisor.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <IconMapper name="Hash" className="w-4 h-4" />
                            <span>ID: {supervisor.employee_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Mail" className="w-4 h-4" />
                            <span>{supervisor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="MapPin" className="w-4 h-4" />
                            <span>{supervisor.zone_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Users" className="w-4 h-4" />
                            <span>{supervisor.team_size} team members</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Position</p>
                            <p className="text-sm font-medium">{supervisor.position}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Shift</p>
                            <p className="text-sm font-medium capitalize">{supervisor.shift}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Performance</p>
                            <p className={`text-sm font-medium ${getPerformanceColor(supervisor.performance_score)}`}>
                              {supervisor.performance_score}%
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Last Active</p>
                            <p className="text-sm font-medium">
                              {format(new Date(supervisor.last_active), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Hire Date</p>
                            <p className="text-sm font-medium">
                              {format(new Date(supervisor.hire_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Emergency Contact</p>
                            <p className="text-sm font-medium">{supervisor.emergency_contact}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {supervisor.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50">
                          <IconMapper name="Eye" className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50">
                          <IconMapper name="Edit" className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-purple-50">
                          <IconMapper name="Users" className="w-4 h-4 mr-2" />
                          Manage Team
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-orange-50">
                          <IconMapper name="MessageSquare" className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSupervisors.length === 0 && (
              <div className="text-center py-12">
                <IconMapper name="UserCog" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No supervisors found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}


