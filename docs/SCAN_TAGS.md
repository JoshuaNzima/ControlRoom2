# Scan Tags

This document describes the scan tagging system added to ControlRoom2.

What it does
- When a supervisor scans a checkpoint, a `CheckpointScan` record is created.
- A background job `TagScanJob` runs using the `redis` queue connection to create a `ScanTag` record with structured metadata (site, client, supervisor, time, latitude/longitude, location quality, geohash, zone).
- After the tag is persisted, the job broadcasts a `ScanTagged` event on the `control-room` private channel so control-room clients receive the full tag in real-time.

Running locally
1. Ensure Redis is running and configured in `.env`:

```
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

2. Run migrations:

```powershell
php artisan migrate
```

3. Start a worker for the `redis` connection:

```powershell
php artisan queue:work redis --queue=default --sleep=3 --tries=3
```

(For production, use Supervisor/systemd to run workers. See Laravel docs.)

Broadcasting
- Ensure Pusher (or compatible) credentials are configured in `.env` (PUSHER_APP_KEY, PUSHER_APP_SECRET, etc.).
- The control-room UI subscribes to the `private-control-room` channel.

Notes
- Tagging is asynchronous to keep the scan UX snappy.
- If you want the controller to return the tag immediately, we can return the tag only after persisting in the job (not recommended) or poll a lightweight endpoint.

