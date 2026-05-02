#!/bin/bash
set -e

cd /home/mubashir/.openclaw/workspace/laughapp--backend

# Start server in background
node dist/main.js > /tmp/server.log 2>&1 &
echo "Server PID: $!"

# Wait longer for DB connection to establish
sleep 12

echo "=== Server log ==="
cat /tmp/server.log | tail -30

echo ""
echo "=== TEST 1: health check ==="
curl -s http://localhost:3000/api/v1/health
echo ""

echo ""
echo "=== TEST 2: send-otp ==="
curl -s -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999"}'
echo ""

echo ""
echo "=== done ==="