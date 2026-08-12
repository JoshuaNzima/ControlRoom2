import React from 'react';
import { Card } from '@/Components/ui/card';
import EmptyState from '@/Components/ui/empty-state';

interface CoverageDataPoint {
  date: string;
  coverage: number;
}

interface AttendanceDataPoint {
  date: string;
  attendance: number;
}

interface AnalyticsTabProps {
  coverageData: CoverageDataPoint[];
  attendanceData: AttendanceDataPoint[];
}

export default function AnalyticsTab({ coverageData, attendanceData }: AnalyticsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Coverage Data (Last 7 Days)</h3>
          <div className="space-y-2">
            {(coverageData || []).length > 0 ? (coverageData || []).map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${Math.min(point.coverage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">
                    {point.coverage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )) : (
              <EmptyState title="No coverage data" description="No coverage data available for the last 7 days." size="sm" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance Data (Last 7 Days)</h3>
          <div className="space-y-2">
            {(attendanceData || []).length > 0 ? (attendanceData || []).map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{point.date}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min((attendanceData || []).length > 0 ? (point.attendance / Math.max(...(attendanceData || []).map(d => d.attendance))) * 100 : 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right text-gray-900 dark:text-gray-100">
                    {point.attendance}
                  </span>
                </div>
              </div>
            )) : (
              <EmptyState title="No attendance data" description="No attendance data available for the last 7 days." size="sm" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
