@echo off
echo =========================================================
echo   OmniPulse - Starting Local Server at http://localhost:3000
echo =========================================================
if not exist node_modules (
  echo Installing Node.js dependencies...
  call npm install
)
if not exist .env (
  copy .env.example .env
)
start http://localhost:3000
node server.js
pause
