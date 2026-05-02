#!/bin/bash
set -e

cd /home/mubashir/.openclaw/workspace/laughapp--backend

# Start the server
node dist/main.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
sleep 8

echo ""
echo "=== TEST 1: POST /api/v1/auth/send-otp ==="
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999"}')
echo "$RESPONSE"
echo ""

# OTP for +15550019999 is 019999 (last 6 digits)
echo ""
echo "=== TEST 2: POST /api/v1/auth/verify-otp ==="
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"019999"}')
echo "$AUTH_RESPONSE"
echo ""

# Test 3: Re-verify same phone (should login as existing user)
echo ""
echo "=== TEST 3: verify-otp again (should be existing user / login) ==="
AUTH_RESPONSE2=$(curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"019999"}')
echo "$AUTH_RESPONSE2"
echo ""

# Test 4: Invalid OTP
echo ""
echo "=== TEST 4: Invalid OTP ==="
INVALID=$(curl -s -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15550019999","otp":"000000"}')
echo "$INVALID"
echo ""

echo "=== Done ==="

kill $SERVER_PID 2>/dev/null