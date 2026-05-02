#!/bin/bash
pkill -f "node.*dist/main" 2>/dev/null
sleep 2

# Start server with nohup so it survives the script
nohup node /home/mubashir/.openclaw/workspace/laughapp--backend/dist/main.js > /tmp/srv.log 2>&1 &
SRV_PID=$!
echo "Server started PID=$SRV_PID"

# Wait for server to be ready
sleep 12

# Verify server is running
if ss -tlnp | grep -q 3000; then
    echo "Port 3000 is bound"
else
    echo "Port 3000 NOT bound"
    cat /tmp/srv.log | tail -20
    exit 1
fi

echo ""
echo "=== TEST 1: send-otp ==="
curl -s -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999"}'
echo ""

echo ""
echo "=== TEST 2: verify-otp (signup) ==="
curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"019999","source":{"videoId":"test-vid"}}'
echo ""

echo ""
echo "=== TEST 3: verify-otp (login) ==="
curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"019999"}'
echo ""

echo ""
echo "=== TEST 4: invalid OTP ==="
curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"000000"}'
echo ""

echo ""
echo "=== All tests done ==="
kill $SRV_PID 2>/dev/null