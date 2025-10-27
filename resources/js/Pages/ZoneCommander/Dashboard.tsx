import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Site {
  id: number;
  name: string;
  client_name: string;
  guard_count: number;
  attendance_today: number;
}

interface Guard {
  id: number;
  name: string;
  risk_level: string;
  infraction_count: number;
  current_site?: {
    name: string;
    client_name: string;
  };
}

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

interface ZoneDashboardProps {
  zone: {
    id: number;
    name: string;
    code: string;
    total_sites: number;
    total_guards: number;
    attendance_rate: number;
  };
  sites: Site[];
  at_risk_guards: Guard[];
  recent_alerts: Alert[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'normal':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ZoneDashboard({ zone, sites, at_risk_guards, recent_alerts }: ZoneDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Network status check
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mock data for charts
  const [attendanceData, setAttendanceData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Attendance Rate',
        data: [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  });

  const [riskDistributionData, setRiskDistributionData] = useState({
    labels: ['Normal', 'Warning', 'High Risk'],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        // Fetch both datasets in parallel
        const [attendanceResponse, riskResponse] = await Promise.all([
          fetch(route('zone.dashboard.data.weekly-attendance')),
          fetch(route('zone.dashboard.data.risk-distribution'))
        ]);

        if (!attendanceResponse.ok || !riskResponse.ok) {
          throw new Error('One or more requests failed');
        }

        const [attendanceData, riskData] = await Promise.all([
          attendanceResponse.json(),
          riskResponse.json()
        ]);

        setAttendanceData(prev => ({
          ...prev,
          labels: attendanceData.labels,
          datasets: [{
            ...prev.datasets[0],
            data: attendanceData.data,
          }],
        }));

        setRiskDistributionData(prev => ({
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            data: riskData.data,
          }],
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <ZoneCommanderLayout title="Zone Dashboard">
      <Head title={`${zone.name} Zone Dashboard`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Zone Overview with Real-time Status */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{zone.name} Zone Dashboard</h1>
                <p className="text-red-100">Zone Code: {zone.code}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="text-sm text-red-100">
                  {format(currentTime, 'MMM d, yyyy • HH:mm:ss')}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconMapper name="Building" className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Total Sites</p>
                    <p className="text-2xl font-bold">{zone.total_sites}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconMapper name="Shield" className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Total Guards</p>
                    <p className="text-2xl font-bold">{zone.total_guards}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconMapper name="CheckCircle" className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Attendance Rate</p>
                    <p className="text-2xl font-bold">{zone.attendance_rate}%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <IconMapper name="AlertTriangle" className="w-6 h-6" />
                  <div>
                    <p className="text-sm opacity-90">Active Alerts</p>
                    <p className="text-2xl font-bold">{recent_alerts.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trend Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapper name="TrendingUp" className="w-5 h-5 text-green-600" />
                Weekly Attendance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="h-64 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <IconMapper name="Loader2" className="w-8 h-8 animate-spin text-red-600" />
                    <span className="text-sm text-gray-600">Loading data...</span>
                  </div>
                </div>
              ) : hasError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <IconMapper name="AlertTriangle" className="w-8 h-8 text-red-600" />
                    <span className="text-sm text-red-600">Failed to load attendance data</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <Line data={attendanceData} options={chartOptions} />
              )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapper name="PieChart" className="w-5 h-5 text-orange-600" />
                Risk Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <IconMapper name="Loader2" className="w-8 h-8 animate-spin text-red-600" />
                      <span className="text-sm text-gray-600">Loading data...</span>
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <IconMapper name="AlertTriangle" className="w-8 h-8 text-red-600" />
                      <span className="text-sm text-red-600">Failed to load risk data</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Doughnut 
                    data={riskDistributionData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Overview */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <IconMapper name="Building" className="w-5 h-5 text-blue-600" />
                  Sites Overview
                </span>
                <Button variant="outline" size="sm" className="hover:bg-blue-50">View All Sites</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sites.map((site, index) => (
                  <div 
                    key={site.id} 
                    className="p-4 rounded-lg border hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-blue-900 transition-colors">{site.name}</h4>
                        <p className="text-sm text-gray-500">{site.client_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Active</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-blue-600">{site.guard_count} Guards</p>
                        <p className="text-sm text-gray-500">{site.attendance_today} Present Today</p>
                        <div className="text-xs text-gray-400 mt-1">
                          {Math.round((site.attendance_today / site.guard_count) * 100)}% attendance
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Guards */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <IconMapper name="AlertTriangle" className="w-5 h-5 text-red-600" />
                  At-Risk Guards
                </span>
                <Button variant="outline" size="sm" className="hover:bg-red-50">View All Guards</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {at_risk_guards.map((guard, index) => (
                  <div 
                    key={guard.id} 
                    className="p-4 rounded-lg border hover:border-red-200 hover:bg-red-50/50 transition-all duration-300 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-red-900 transition-colors">{guard.name}</h4>
                        <p className="text-sm text-gray-500">
                          {guard.current_site 
                            ? `${guard.current_site.client_name} - ${guard.current_site.name}`
                            : 'Unassigned'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <IconMapper name="Clock" className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Last seen 2 hours ago</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(guard.risk_level)}`}>
                          {guard.risk_level.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 text-center">
                          {guard.infraction_count} infractions
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="Bell" className="w-5 h-5 text-yellow-600" />
              Recent Alerts
              <span className="ml-auto text-sm text-gray-500">
                {recent_alerts.length} active alerts
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent_alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-lg border hover:border-yellow-200 hover:bg-yellow-50/50 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)} group-hover:scale-110 transition-transform duration-300`}>
                    <IconMapper name="AlertTriangle" className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium group-hover:text-yellow-900 transition-colors">{alert.type}</h4>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <IconMapper name="Clock" className="w-3 h-3" />
                        {format(new Date(alert.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <IconMapper name="Zap" className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => window.location.href = route('zone.patrols.start')}
                className="h-20 flex flex-col gap-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-300 hover:scale-105"
              >
                <IconMapper name="ScanLine" className="w-6 h-6" />
                <span className="text-sm font-medium">Start Patrol</span>
              </Button>
              <Button 
                onClick={() => window.location.href = route('zone.attendance.check-in')}
                className="h-20 flex flex-col gap-2 bg-white hover:bg-green-50 border border-green-200 text-green-700 hover:text-green-800 transition-all duration-300 hover:scale-105"
              >
                <IconMapper name="UserCheck" className="w-6 h-6" />
                <span className="text-sm font-medium">Check In</span>
              </Button>
              <Button 
                onClick={() => window.location.href = route('zone.reports.generate')}
                className="h-20 flex flex-col gap-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 hover:text-orange-800 transition-all duration-300 hover:scale-105"
              >
                <IconMapper name="FileText" className="w-6 h-6" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
              <Button 
                onClick={() => window.location.href = route('profile.edit')}
                className="h-20 flex flex-col gap-2 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-300 hover:scale-105"
              >
                <IconMapper name="Settings" className="w-6 h-6" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}