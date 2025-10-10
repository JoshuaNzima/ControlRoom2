<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install - Configuration</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f8fafc; color:#0f172a; }
        .card { max-width:720px; margin:40px auto; background:#fff; border-radius:16px; padding:24px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .btn { display:inline-block; padding:12px 16px; background:#ef4444; color:#fff; border-radius:10px; text-decoration:none; font-weight:700; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .full { grid-column:1 / -1; }
        label { font-weight:600; font-size:12px; color:#475569; display:block; margin-bottom:6px; }
        input { width:100%; padding:10px 12px; border:1px solid #e2e8f0; border-radius:10px; }
        h1 { margin:0 0 8px; font-size:24px; }
        p { margin:0 0 16px; color:#475569; }
    </style>
    </head>
<body>
    <div class="card">
        <h1>Configuration</h1>
        <p>Enter application and database settings.</p>

        <form method="POST" action="{{ route('install.configure') }}">
            @csrf
            <div class="grid">
                <div class="full">
                    <label>App Name</label>
                    <input name="app_name" value="ControlRoom2" required />
                </div>
                <div class="full">
                    <label>App URL</label>
                    <input name="app_url" value="https://example.com" required />
                </div>
                <div>
                    <label>DB Host</label>
                    <input name="db_host" value="127.0.0.1" required />
                </div>
                <div>
                    <label>DB Port</label>
                    <input name="db_port" value="3306" required />
                </div>
                <div>
                    <label>DB Name</label>
                    <input name="db_database" value="controlroom" required />
                </div>
                <div>
                    <label>DB Username</label>
                    <input name="db_username" value="root" required />
                </div>
                <div class="full">
                    <label>DB Password</label>
                    <input name="db_password" type="password" />
                </div>
                <div class="full">
                    <label>Admin Name</label>
                    <input name="admin_name" required />
                </div>
                <div>
                    <label>Admin Email</label>
                    <input name="admin_email" type="email" required />
                </div>
                <div>
                    <label>Admin Password</label>
                    <input name="admin_password" type="password" required />
                </div>
            </div>

            <div style="margin-top:16px;">
                <button class="btn" type="submit">Install</button>
            </div>
        </form>
    </div>
</body>
</html>


