<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Incident #{{ $incident->id }}</title>
  <style>
    body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
    .container { width: 100%; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #b92f2a; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { display: table; width: 100%; }
    .brand-left { display: table-cell; vertical-align: middle; }
    .brand-right { display: table-cell; vertical-align: middle; text-align: right; }
    .brand-name { color: #b92f2a; font-weight: 700; font-size: 18px; }
    .muted { color: #555; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .grid { display: table; width: 100%; table-layout: fixed; }
    .col { display: table-cell; vertical-align: top; }
    .col + .col { padding-left: 12px; }
    .label { font-size: 11px; text-transform: uppercase; color: #555; letter-spacing: 0.04em; }
    .value { margin-top: 2px; font-weight: 600; }
    .block { margin-top: 10px; }
    .divider { height: 1px; background: #e5e7eb; margin: 10px 0; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; border: 1px solid #e5e7eb; }
    .footer { margin-top: 18px; color: #666; font-size: 11px; text-align: center; }
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
          <div style="display:inline-block; margin-left:10px; vertical-align:middle;" class="brand-name">{{ $appName ?? config('app.name', 'Control Room') }}</div>
        </div>
        <div class="brand-right">
          <div style="font-weight:700; font-size:16px;">Incident Report</div>
          <div class="muted">#{{ $incident->id }}</div>
          <div class="muted">Created: {{ optional($incident->created_at)->format('Y-m-d H:i') }}</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="grid">
        <div class="col">
          <div class="label">Status</div>
          <div class="value">{{ strtoupper(str_replace('_', ' ', (string)($incident->status ?? ''))) ?: '-' }}</div>
          <div class="block">
            <div class="label">Severity</div>
            <div class="value">{{ strtoupper((string)($incident->severity ?? '')) ?: '-' }}</div>
          </div>
          <div class="block">
            <div class="label">Type</div>
            <div class="value">{{ strtoupper(str_replace('_', ' ', (string)($incident->type ?? ''))) ?: '-' }}</div>
          </div>
        </div>
        <div class="col">
          <div class="label">Location</div>
          <div class="value">{{ (string)($incident->location ?? '') ?: '-' }}</div>
          <div class="block">
            <div class="label">Client / Site</div>
            <div class="value">
              {{ optional($incident->client)->name ?: 'N/A' }}
              @if(optional($incident->clientSite)->name)
                <span class="muted"> • {{ $incident->clientSite->name }}</span>
              @endif
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="label">People</div>
      <div class="divider"></div>
      <div class="grid">
        <div class="col">
          <div class="label">Reporter</div>
          <div class="value">{{ optional($incident->reporter)->name ?: 'Unknown' }}</div>
          <div class="block">
            <div class="label">Assigned To</div>
            <div class="value">{{ optional($incident->assignedTo)->name ?: 'Unassigned' }}</div>
          </div>
        </div>
        <div class="col">
          <div class="label">Guard</div>
          <div class="value">
            @php($g = $incident->guardRelation)
            @if($g)
              {{ $g->name }}@if($g->employee_id) <span class="muted">({{ $g->employee_id }})</span>@endif
            @else
              N/A
            @endif
          </div>
          <div class="block">
            <div class="label">Escalation Level</div>
            <div class="value">{{ (int)($incident->escalation_level ?? 0) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:12px;">
      <div class="label">Incident Details</div>
      <div class="divider"></div>
      <div class="block">
        <div style="font-weight:700;">Title</div>
        <div style="margin-top:4px;">{{ (string)($incident->title ?? '') ?: '-' }}</div>
      </div>
      <div class="block">
        <div style="font-weight:700;">Description</div>
        <div style="margin-top:4px; white-space: pre-wrap;">{{ (string)($incident->description ?? '') ?: '-' }}</div>
      </div>
    </div>

    @if($incident->resolved_at || $incident->resolved_by)
      <div class="card" style="margin-bottom:12px;">
        <div class="label">Resolution</div>
        <div class="divider"></div>
        <div class="grid">
          <div class="col">
            <div class="label">Resolved At</div>
            <div class="value">{{ optional($incident->resolved_at)->format('Y-m-d H:i') ?: '-' }}</div>
          </div>
          <div class="col">
            <div class="label">Resolved By</div>
            <div class="value">{{ optional($incident->resolvedBy)->name ?: '-' }}</div>
          </div>
        </div>
      </div>
    @endif

    @php($comments = $incident->comments ?? collect())
    <div class="card">
      <div class="label">Comments</div>
      <div class="divider"></div>
      @if($comments->count() === 0)
        <div class="muted">No comments.</div>
      @else
        @foreach($comments as $c)
          <div style="margin-bottom:10px;">
            <div class="muted" style="font-size:11px;">
              {{ optional($c->user)->name ?: 'Unknown' }}
              @if($c->created_at)
                <span> • {{ optional($c->created_at)->format('Y-m-d H:i') }}</span>
              @endif
              @if(isset($c->is_internal) && $c->is_internal)
                <span class="pill">INTERNAL</span>
              @endif
            </div>
            <div style="margin-top:4px; white-space: pre-wrap;">{{ (string)($c->comment ?? '') }}</div>
          </div>
        @endforeach
      @endif
    </div>

    <div class="footer">
      Generated by Control Room
    </div>
  </div>
</body>
</html>
