@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  set "PYTHON=py -3"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Se necesita Python 3.9 o superior. Instalelo y vuelva a ejecutar INICIAR.bat.
    pause
    exit /b 1
  )
  set "PYTHON=python"
)
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5174/'"
%PYTHON% server.py
if errorlevel 1 pause
