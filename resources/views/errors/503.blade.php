<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ config('app.name') }} – Maintenance</title>
  <style>
    :root { color-scheme: dark; }
    html, body { height: 100%; }
    body { margin: 0; background: #0b0f17; color: #e5e7eb; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; display: flex; align-items: center; justify-content: center; }
    .wrap { text-align: center; padding: 24px; max-width: 560px; width: 100%; }
    .logo { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 10px; background: #1f2937; color: #c7d2fe; margin: 0 auto 12px; font-weight: 700; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 22px; }
    .title { font-size: 22px; line-height: 1.25; font-weight: 700; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #9ca3af; margin: 0 0 18px; }
    .cta { display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px; background: #4f46e5; color: #fff; padding: 10px 14px; border-radius: 8px; text-decoration: none; font-size: 14px; }
    .cta:hover { background: #4338ca; }
    .foot { font-size: 12px; color: #6b7280; margin-top: 14px; }
    @media (min-width: 640px) {
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">{{ mb_substr(config('app.name', 'CR'), 0, 2) }}</div>
    <div class="card">
      <div class="title">{{ config('app.name') }} is undergoing maintenance</div>
      <div class="subtitle">We’re performing some updates. The system will be back shortly.</div>
      <a class="cta" href="" onclick="location.reload(); return false;">Try again</a>
      <div class="foot">If this persists, contact your administrator.</div>
    </div>
  </div>
</body>
</html>
