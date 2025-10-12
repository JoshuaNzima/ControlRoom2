$files = Get-ChildItem -Path resources -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.php,*.blade.php -ErrorAction SilentlyContinue
$usages = @{}
$pattern = 'route\(\s*["\']([^"\']+)["\']'
foreach ($f in $files) {
  $matches = Select-String -Path $f.FullName -Pattern $pattern -AllMatches
  foreach ($m in $matches) {
    foreach ($g in $m.Matches) {
      $name = $g.Groups[1].Value
      if (-not $usages.ContainsKey($name)) { $usages[$name] = @() }
      $usages[$name] += "$($f.FullName):$($m.LineNumber): $($m.Line.Trim())"
    }
  }
}
$routes = php artisan route:list --json | ConvertFrom-Json
$routeNames = $routes | Where-Object { $_.name } | Select-Object -ExpandProperty name | Sort-Object -Unique
$missing = @{}
foreach ($k in $usages.Keys) {
  if ($routeNames -notcontains $k) { $missing[$k] = $usages[$k] }
}
$out = @{ used = $usages; routes = $routeNames; missing = $missing; totalUsed = $usages.Keys.Count; totalRoutes = $routeNames.Count; missingCount = $missing.Keys.Count }
$out | ConvertTo-Json -Depth 10 | Out-File compare_routes.json -Encoding utf8
