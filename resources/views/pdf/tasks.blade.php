<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Task Report</title>
  <style>
    body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
    .container { width: 100%; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #b92f2a; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { display: table; width: 100%; }
    .brand-left { display: table-cell; vertical-align: middle; }
    .brand-right { display: table-cell; vertical-align: middle; text-align: right; }
    .brand-name { color: #b92f2a; font-weight: 700; font-size: 18px; }
    .muted { color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #b92f2a; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 18px; color: #666; font-size: 11px; text-align: center; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-in_progress { background: #ede9fe; color: #5b21b6; }
    .badge-completed { background: #d1fae5; color: #065f46; }
    .badge-overdue { background: #fee2e2; color: #991b1b; }
    .badge-cancelled { background: #f3f4f6; color: #374151; }
    .badge-low { background: #dbeafe; color: #1e40af; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .summary { display: table; width: 100%; margin-bottom: 16px; }
    .summary-col { display: table-cell; padding: 12px; background: #f9fafb; border-radius: 8px; width: 25%; }
    .summary-col + .summary-col { margin-left: 8px; }
    .summary-label { font-size: 11px; color: #555; text-transform: uppercase; }
    .summary-value { font-size: 18px; font-weight: 700; color: #111; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="brand-left">
          <div style="display:inline-block; vertical-align:middle;">
            <img src="{{ public_path('images/Coin-logo.png') }}" alt="Logo" style="height:38px;" />
          </div>
          <div style="display:inline-block; margin-left:10px; vertical-align:middle;" class="brand-name">{{ config('app.name', 'Control Room') }}</div>
        </div>
        <div class="brand-right">
          <div style="font-weight:700; font-size:16px;">Task Report</div>
          <div class="muted">Generated: {{ $generatedAt }}</div>
        </div>
      </div>
    </div>

    @php
      $total = $tasks->count();
      $pending = $tasks->where('status', 'pending')->count();
      $completed = $tasks->where('status', 'completed')->count();
      $overdue = $tasks->where('status', 'overdue')->count();
    @endphp

    <div class="summary">
      <div class="summary-col">
        <div class="summary-label">Total Tasks</div>
        <div class="summary-value">{{ $total }}</div>
      </div>
      <div class="summary-col">
        <div class="summary-label">Pending</div>
        <div class="summary-value">{{ $pending }}</div>
      </div>
      <div class="summary-col">
        <div class="summary-label">Completed</div>
        <div class="summary-value">{{ $completed }}</div>
      </div>
      <div class="summary-col">
        <div class="summary-label">Overdue</div>
        <div class="summary-value">{{ $overdue }}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Category</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Due Date</th>
          <th>Assigned To</th>
          <th>Created By</th>
        </tr>
      </thead>
      <tbody>
        @forelse($tasks as $task)
          <tr>
            <td>{{ $task->id }}</td>
            <td>
              <strong>{{ $task->title }}</strong>
              @if($task->description)
                <br><span class="muted" style="font-size:10px;">{{ Str::limit($task->description, 50) }}</span>
              @endif
            </td>
            <td><span class="badge">{{ str_replace('_', ' ', ucfirst($task->category)) }}</span></td>
            <td><span class="badge badge-{{ $task->status }}">{{ str_replace('_', ' ', ucfirst($task->status)) }}</span></td>
            <td><span class="badge badge-{{ $task->priority }}">{{ ucfirst($task->priority) }}</span></td>
            <td>{{ $task->due_date ? $task->due_date->format('Y-m-d') : '-' }}</td>
            <td>{{ $task->assignee?->name ?? 'Unassigned' }}</td>
            <td>{{ $task->createdBy?->name ?? '-' }}</td>
          </tr>
        @empty
          <tr>
            <td colspan="8" style="text-align:center; color:#555;">No tasks found</td>
          </tr>
        @endforelse
      </tbody>
    </table>

    <div class="footer">
      Generated by Control Room
    </div>
  </div>
</body>
</html>
