@echo off
title CBSE School ERP - Next.js Live Dev Agent & Fast Refresh
echo =========================================================
echo   CBSE School ERP - Next.js Dev Agent with Fast Refresh
echo =========================================================
echo Starting Next.js Live Development Server on http://localhost:3000 ...
echo [Features]: Fast Refresh, Interactive Error Overlay, 'N' Dev Inspector
cd /d "%~dp0"
start http://localhost:3000/app
npm run dev
pause

