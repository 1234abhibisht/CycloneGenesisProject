$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
$pythonExe = 'C:\Users\HP\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$nodeExe = 'C:\Program Files\nodejs\node.exe'
$env:PYTHONPATH = 'D:\SIH\Research paper work\integration_work\api_dependencies;D:\SIH\Research paper work\ml_dependencies'
New-Item -ItemType Directory -Path (Join-Path $project 'logs') -Force | Out-Null
try { $api = Invoke-RestMethod 'http://127.0.0.1:8002/api/system/status' -TimeoutSec 2 } catch { $api = $null }
if (-not $api) {
    Start-Process -FilePath $pythonExe -ArgumentList @('-m','uvicorn','compatibility_api:app','--host','127.0.0.1','--port','8002') -WorkingDirectory (Join-Path $project 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $project 'logs\backend.log') -RedirectStandardError (Join-Path $project 'logs\backend-errors.log') | Out-Null
}
try { $web = Invoke-WebRequest 'http://127.0.0.1:3002' -TimeoutSec 2 } catch { $web = $null }
if (-not $web) {
    $vite = Join-Path $project 'node_modules\vite\bin\vite.js'
    Start-Process -FilePath $nodeExe -ArgumentList ('"' + $vite + '" --host 127.0.0.1 --port 3002 --strictPort') -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput (Join-Path $project 'logs\frontend.log') -RedirectStandardError (Join-Path $project 'logs\frontend-errors.log') | Out-Null
}
Write-Output 'FB integerated: http://127.0.0.1:3002/dashboard/warnings'
