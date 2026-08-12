<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
        body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; color:#111827; background:#f9fafb; margin:0; padding:24px; }
        .card { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
        .brand { text-align:center; margin-bottom:16px; color:#b91c1c; font-weight:700; font-size:20px; }
        .title { text-align:center; font-size:22px; font-weight:800; margin:8px 0 16px; color:#111827; }
        .muted { color:#6b7280; font-size:14px; }
        .btn { display:inline-block; background:#b91c1c; color:#fff !important; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:700; margin:16px 0; }
        .divider { height:1px; background:#e5e7eb; margin:24px 0; }
        .footer { text-align:center; color:#6b7280; font-size:12px; margin-top:8px; }
        a { color:#b91c1c; }
    </style>
</head>
<body>
    <div class="card">
        <div class="brand">🛡️ Coin Security</div>
        @if(!empty($title))
            <div class="title">{{ $title }}</div>
        @endif

        @yield('content')

        <div class="divider"></div>
        <p class="footer">© {{ date('Y') }} Coin Security. All rights reserved.</p>
    </div>
</body>
</html>
