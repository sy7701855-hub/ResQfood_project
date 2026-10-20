@echo off
title ResQFood Local Server
color 0A
echo ========================================================
echo       Starting ResQFood Surplus Food Rescue Server
echo ========================================================
echo.
cd /d "%~dp0"

echo Opening browser at http://localhost:5000...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"

echo Starting Node.js server...
echo Press Ctrl+C anytime to stop the server.
echo.
npm start
pause
