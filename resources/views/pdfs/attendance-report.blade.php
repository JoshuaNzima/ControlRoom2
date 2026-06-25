<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attendance Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 20px; margin: 0; color: #1a1a1a; }
        .header p { margin: 4px 0; color: #666; }
        .summary { margin-bottom: 20px; }
        .summary table { width: 100%; border-collapse: collapse; }
        .summary td { padding: 6px 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; }
        .summary td:first-child { background: #e8f5e9; color: #2e7d32; }
        .summary td:nth-child(2) { background: #fff8e1; color: #f57f17; }
        .summary td:nth-child(3) { background: #ffebee; color: #c62828; }
        .records { width: 100%; border-collapse: collapse; font-size: 10px; }
        .records th { background: #37474f; color: white; padding: 6px 8px; text-align: left; }
        .records td { padding: 4px 8px; border-bottom: 1px solid #eee; }
        .records tr:nth-child(even) { background: #f9f9f9; }
        .status-present { color: #2e7d32; }
        .status-late { color: #f57f17; }
        .status-absent { color: #c62828; }
        .footer { margin-top: 20px; text-align: center; color: #999; font-size: 9px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .badge-present { background: #e8f5e9; color: #2e7d32; }
        .badge-late { background: #fff8e1; color: #f57f17; }
        .badge-absent { background: #ffebee; color: #c62828; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Attendance Report</h1>
        <p>Period: {{ $from }} to {{ $to }}</p>
        <p>Generated: {{ $generatedAt }}</p>
        <p>Supervisor: {{ $supervisorName }}</p>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td style="width:33%">Present: {{ $summary['present'] ?? 0 }}</td>
                <td style="width:33%">Late: {{ $summary['late'] ?? 0 }}</td>
                <td style="width:34%">Absent: {{ $summary['absent'] ?? 0 }}</td>
            </tr>
        </table>
        <p style="text-align:center;margin-top:6px;font-size:10px;color:#666;">
            Total records: {{ count($records) }} |
            Attendance rate: {{ ($summary['present'] ?? 0) + ($summary['late'] ?? 0) > 0 ? round((($summary['present'] ?? 0) + ($summary['late'] ?? 0)) / max(count($records), 1) * 100) : 0 }}%
        </p>
    </div>

    <table class="records">
        <thead>
            <tr>
                <th>Date</th>
                <th>Guard</th>
                <th>Site</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($records as $record)
            <tr>
                <td>{{ $record['date'] }}</td>
                <td>{{ $record['guard_name'] }}</td>
                <td>{{ $record['site_name'] }}</td>
                <td>{{ $record['check_in'] ?? '-' }}</td>
                <td>{{ $record['check_out'] ?? '-' }}</td>
                <td>{{ $record['hours'] ?? 0 }}h</td>
                <td>
                    <span class="badge badge-{{ $record['status'] }}">
                        {{ ucfirst($record['status']) }}
                    </span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" style="text-align:center;padding:20px;color:#999;">No attendance records found for this period.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        CoinSec Security - Attendance Report - Confidential
    </div>
</body>
</html>
