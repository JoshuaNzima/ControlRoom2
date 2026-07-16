Get-ChildItem -Path "c:\Users\Coin Security\Documents\GitHub\ControlRoom2\resources\js" -Recurse -Filter *.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "from.*@/Layouts/(Admin|SuperAdmin|Supervisor|Operations|Finance|ControlRoom|HR|AssetManagement|BusinessDev|Client|FrontDesk|FrontOffice|Marketing|TaskTracker|Training|ZoneCommander)Layout") {
        Write-Output $_.FullName
    }
}
