@echo off
setlocal
cd /d "%~dp0"
title Radio - First-time Setup

echo This setup downloads audio.cpp and about 3 GB of Yue2 model files.
echo It does not install LM Studio or Node.js.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
if errorlevel 1 (
  echo.
  echo Setup did not finish. Read the message above and try again.
)
echo.
pause
