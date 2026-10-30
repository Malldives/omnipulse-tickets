#!/usr/bin/env bash
echo "========================================================="
echo "  OmniPulse - Starting Local Server at http://localhost:3000"
echo "========================================================="
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi
if [ ! -f ".env" ]; then
  cp .env.example .env
fi
node server.js
