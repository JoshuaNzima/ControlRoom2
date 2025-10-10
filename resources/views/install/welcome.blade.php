<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install - Requirements</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f8fafc; color:#0f172a; }
        .card { max-width:720px; margin:40px auto; background:#fff; border-radius:16px; padding:24px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .btn { display:inline-block; padding:12px 16px; background:#ef4444; color:#fff; border-radius:10px; text-decoration:none; font-weight:700; }
        .ok { color:#16a34a; font-weight:600; }
        .bad { color:#dc2626; font-weight:600; }
        ul { list-style:none; padding-left:0; }
        li { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f1f5f9; }
        h1 { margin:0 0 8px; font-size:24px; }
        p { margin:0 0 16px; color:#475569; }
    </style>
    </head>
<body>
    <div class="card">
        <h1>ControlRoom2 Installer</h1>
        <p>Checking server requirements and permissions.</p>
        <ul>
            <li><span>PHP >= 8.1</span><span class="{{ $requirements['php'] ? 'ok' : 'bad' }}">{{ $requirements['php'] ? 'OK' : 'Missing' }}</span></li>
            @foreach($requirements['exts'] as $ext => $ok)
            <li><span>ext: {{ $ext }}</span><span class="{{ $ok ? 'ok' : 'bad' }}">{{ $ok ? 'OK' : 'Missing' }}</span></li>
            @endforeach
            @foreach($requirements['writable'] as $path => $ok)
            <li><span>Writable: {{ $path }}</span><span class="{{ $ok ? 'ok' : 'bad' }}">{{ $ok ? 'OK' : 'Not writable' }}</span></li>
            @endforeach
        </ul>
        <form method="POST" action="{{ route('install.check') }}">
            @csrf
            <button class="btn" type="submit">Continue</button>
        </form>
    </div>
</body>
</html>


