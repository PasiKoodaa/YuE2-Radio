@echo off
setlocal
cd /d "%~dp0"
title Radio - Local AI Airwaves

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo PowerShell is required on Windows 10.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1"
if errorlevel 1 (
  echo.
  echo Radio stopped with an error. Read the message above.
  pause
)
