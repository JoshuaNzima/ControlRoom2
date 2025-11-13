import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  BellIcon, 
  MapPinIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Guard {
  id: number;
  name: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
  lastCheckIn: string;
}

interface Incident {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function LiveMonitoringDashboard() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activityData, setActivityData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Guard Activity',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  });

  useEffect(() => {
    // Subscribe to real-time updates
    const echo = window.Echo;
    
    echo.private('monitoring')
      .listen('GuardLocationUpdated', (e: any) => {
        setGuards(current => {
          const index = current.findIndex(g => g.id === e.guard.id);
          if (index === -1) return [...current, e.guard];
          const newGuards = [...current];
          newGuards[index] = e.guard;
          return newGuards;
        });
      })
      .listen('IncidentReported', (e: any) => {
        setIncidents(current => [e.incident, ...current]);
      });

    // Cleanup
    return () => {
      echo.leave('monitoring');
    };
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Map Section */}
      <div className="col-span-8 bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium mb-4">Live Guard Locations</h2>
        <div className="h-[500px] rounded-lg overflow-hidden">
          <MapContainer
            center={[-26.2041, 28.0473]}
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {guards.map((guard) => (
              <Marker key={guard.id} position={[guard.location.lat, guard.location.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-medium">{guard.name}</h3>
                    <p className="text-sm text-gray-600">Status: {guard.status}</p>
                    <p className="text-sm text-gray-600">
                      Last Check-in: {new Date(guard.lastCheckIn).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="col-span-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Active Guards</p>
                <p className="text-2xl font-semibold">{guards.filter(g => g.status === 'active').length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Active Incidents</p>
                <p className="text-2xl font-semibold">{incidents.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {incidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-l-4 border-red-500 pl-4 py-2"
              >
                <p className="font-medium">{incident.type}</p>
                <p className="text-sm text-gray-600">{incident.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(incident.timestamp).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-medium mb-4">Activity Trends</h2>
          <Line data={activityData} options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
          }} />
        </div>
      </div>
    </div>
  );
}