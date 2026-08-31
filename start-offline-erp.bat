@echo off
title CBSE School ERP - Offline Server
echo ===================================================
echo   CBSE School ERP - Offline Local Server
echo ===================================================
echo Starting local production server on http://localhost:3000 ...
cd /d "%~dp0"
start http://localhost:3000/app
npm run start
pause
