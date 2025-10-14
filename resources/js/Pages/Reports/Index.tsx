import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DatePicker from '@/Components/DatePicker';
import Select from '@/Components/Select';
import PrimaryButton from '@/Components/PrimaryButton';
import axios from 'axios';

type ReportType = {
  id: string;
  name: string;
  description?: string;
};

type Guard = { id: number; name: string };
type Site = { id: number; name: string };

export default function ReportsIndex() {
  const { props } = usePage();
  const reportTypes = (props.reportTypes as ReportType[]) ?? [];
  const guards = (props.guards as Guard[]) ?? [];
  const sites = (props.sites as Site[]) ?? [];

  const [selectedReport, setSelectedReport] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guardId, setGuardId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(route('reports.generate'), {
        type: selectedReport,
        start_date: startDate,
        end_date: endDate,
        guard_id: guardId || undefined,
        site_id: siteId || undefined,
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
    setLoading(false);
  };

  const renderReportContent = () => {
    if (!reportData) return null;
    switch (selectedReport) {
      case 'attendance':
        return renderAttendanceReport();
      case 'shifts':
        return renderShiftsReport();
      case 'guard_performance':
        return renderGuardPerformanceReport();
      case 'site_coverage':
        return renderSiteCoverageReport();
      default:
        return null;
    }
  };

  const renderAttendanceReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.map((record: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.guard_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.check_in}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.check_out}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.hours_worked}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderShiftsReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.map((record: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.guard_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.shift_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.start_time} - {record.end_time}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.duration}h</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGuardPerformanceReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guard</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shifts</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hours</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.map((record: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.guard_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.total_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.on_time_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.late_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.absent_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.attendance_rate}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.average_hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSiteCoverageReport = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shifts</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage Rate</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Shifts/Day</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reportData.map((record: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.total_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.completed_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.cancelled_shifts}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.coverage_rate}%</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.average_shifts_per_day}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AuthenticatedLayout>
      <Head title="Reports" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Select label="Report Type" value={selectedReport} onChange={e => setSelectedReport(e.target.value)} required>
                    <option value="">Select a report</option>
                    {reportTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <DatePicker label="Start Date" selected={startDate} onChange={(date: any) => setStartDate(date)} required />
                </div>

                <div>
                  <DatePicker label="End Date" selected={endDate} onChange={(date: any) => setEndDate(date)} minDate={startDate} required />
                </div>

                {['attendance', 'shifts', 'guard_performance'].includes(selectedReport) && (
                  <div>
                    <Select label="Guard" value={guardId} onChange={e => setGuardId(e.target.value)}>
                      <option value="">All Guards</option>
                      {guards.map((guard) => (
                        <option key={guard.id} value={guard.id}>{guard.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {['attendance', 'shifts', 'site_coverage'].includes(selectedReport) && (
                  <div>
                    <Select label="Site" value={siteId} onChange={e => setSiteId(e.target.value)}>
                      <option value="">All Sites</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <PrimaryButton onClick={generateReport} disabled={!selectedReport || !startDate || !endDate || loading}>
                  {loading ? 'Generating...' : 'Generate Report'}
                </PrimaryButton>
              </div>
            </div>

            {reportData && (
              <div className="border-t border-gray-200 p-6">
                {renderReportContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}