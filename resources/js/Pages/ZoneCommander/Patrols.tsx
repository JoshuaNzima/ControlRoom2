import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';
import { format } from 'date-fns';

interface Patrol {
  id: number;
  guard_name: string;
  site_name: string;
  checkpoint_name: string;
  status: 'completed' | 'in_progress' | 'missed';
  scan_time: string;
  location: string;
  notes: string;
  photos: string[];
}

interface PatrolsProps {
  patrols: Patrol[];
}

export default function Patrols({ patrols = [] }: PatrolsProps) {
  const [activeScan, setActiveScan] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedPatrols = patrols.filter(p => p.status === 'completed').length;
  const inProgressPatrols = patrols.filter(p => p.status === 'in_progress').length;
  const missedPatrols = patrols.filter(p => p.status === 'missed').length;

  return (
    <ZoneCommanderLayout title="Patrols">
      <Head title="Patrol Management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="ScanLine" className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Patrols</p>
                  <p className="text-2xl font-bold text-gray-900">{patrols.length}</p>
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
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedPatrols}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="Clock" className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{inProgressPatrols}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <IconMapper name="XCircle" className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missed</p>
                  <p className="text-2xl font-bold text-gray-900">{missedPatrols}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <IconMapper name="QrCode" className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-64 h-64 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <IconMapper name="QrCode" className="w-32 h-32 text-gray-400" />
              </div>
              <Button 
                onClick={() => setActiveScan(!activeScan)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {activeScan ? 'Stop Scanning' : 'Start QR Scan'}
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Point your camera at a checkpoint QR code to scan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Patrols */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMapper name="History" className="w-5 h-5" />
              Recent Patrols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patrols.map((patrol) => (
                <Card key={patrol.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{patrol.checkpoint_name}</h3>
                          <Badge className={getStatusColor(patrol.status)}>
                            {patrol.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <IconMapper name="User" className="w-4 h-4" />
                            <span>{patrol.guard_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="MapPin" className="w-4 h-4" />
                            <span>{patrol.site_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconMapper name="Clock" className="w-4 h-4" />
                            <span>{format(new Date(patrol.scan_time), 'MMM d, HH:mm')}</span>
                          </div>
                        </div>

                        {patrol.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{patrol.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50">
                          <IconMapper name="Eye" className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50">
                          <IconMapper name="Edit" className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ZoneCommanderLayout>
  );
}


