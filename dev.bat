@echo off
cd /d "%~dp0"

start "api" cmd /k "cd /d %~dp0api && npm run dev"
start "web" cmd /k "cd /d %~dp0web && npm run dev"
