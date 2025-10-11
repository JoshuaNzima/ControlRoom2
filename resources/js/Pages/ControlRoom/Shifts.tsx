import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

interface ShiftsProps {
  auth?: { user?: { name?: string } };
}

const Shifts = ({ auth }: ShiftsProps) => {
  // Mock data for shifts
  const shifts = [
    {
      id: 1,
      name: 'Day Shift',
      startTime: '06:00',
      endTime: '18:00',
      duration: '12 hours',
      guards: 8,
      assignedGuards: 7,
      status: 'active',
      sites: ['Site A', 'Site B', 'Site C'],
      supervisor: 'John Smith',
      coverage: 87.5
    },
    {
      id: 2,
      name: 'Night Shift',
      startTime: '18:00',
      endTime: '06:00',
      duration: '12 hours',
      guards: 6,
      assignedGuards: 6,
      status: 'active',
      sites: ['Site A', 'Site B', 'Site D'],
      supervisor: 'Jane Doe',
      coverage: 100.0
    },
    {
      id: 3,
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      duration: '8 hours',
      guards: 4,
      assignedGuards: 3,
      status: 'understaffed',
      sites: ['Site C', 'Site D'],
      supervisor: 'Mike Johnson',
      coverage: 75.0
    },
    {
      id: 4,
      name: 'Evening Shift',
      startTime: '16:00',
      endTime: '00:00',
      duration: '8 hours',
      guards: 5,
      assignedGuards: 5,
      status: 'active',
      sites: ['Site A', 'Site B', 'Site C', 'Site D'],
      supervisor: 'Sarah Wilson',
      coverage: 100.0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'understaffed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return 'text-green-600 dark:text-green-400';
    if (coverage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCoverageBgColor = (coverage: number) => {
    if (coverage >= 90) return 'bg-green-500';
    if (coverage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <ControlRoomLayout title="Shift Management" user={auth?.user as any}>
      <Head title="Shift Management" />

      <div className="space-y-6">
        {/* Shift Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Shifts</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">3</p>
                </div>
                <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">⏰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Guards</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">23</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">👮</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned Guards</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">21</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coverage Rate</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">91.3%</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Current Shifts</h3>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
              Create New Shift
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{shift.name}</h4>
                        <Badge className={`text-xs ${getStatusColor(shift.status)}`}>
                          {shift.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                          {shift.duration}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Time:</span> {shift.startTime} - {shift.endTime} • 
                        <span className="font-medium"> Guards:</span> {shift.assignedGuards}/{shift.guards} • 
                        <span className="font-medium"> Supervisor:</span> {shift.supervisor}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">Sites:</span> {shift.sites.join(', ')}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${getCoverageColor(shift.coverage)}`}>
                        {shift.coverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Coverage
                      </div>
                    </div>
                  </div>
                  
                  {/* Coverage Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full ${getCoverageBgColor(shift.coverage)}`}
                      style={{ width: `${Math.min(shift.coverage, 100)}%` }}
                    ></div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      View Guards
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      Assign Guards
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      Edit Shift
                    </Button>
                    <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      Reports
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Shift Management</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">➕</span>
                <span className="text-sm">Create Shift</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">👮</span>
                <span className="text-sm">Assign Guards</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📅</span>
                <span className="text-sm">Schedule</span>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">📊</span>
                <span className="text-sm">Shift Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default Shifts;
