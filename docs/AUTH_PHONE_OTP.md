# Authentication — Phone OTP

> **Status:** DEV mode only (OTP = last 6 digits of phone number)
> Production: integrate Twilio / MessageBird / AWS SNS for real SMS delivery.

---

## Overview

Phone-only authentication. No email, no password, no social login.

```
send-otp  →  verify-otp  →  access + refresh tokens
```

---

## Endpoints

### POST /auth/send-otp

Send a one-time password to a phone number.

**DEV Mode:** OTP = last 6 digits of the phone number (logged to server console)

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent (check console in DEV mode)"
}
```

**Errors:**
- `400` — phone number missing or invalid

---

### POST /auth/verify-otp

Verify OTP and receive authentication tokens. Also handles login (existing user) or signup (new user).

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "789012",
  "source": {
    "videoId": "uuid",
    "creatorId": "uuid",
    "inviteId": "uuid"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phoneNumber` | string | ✅ | Normalized (spaces/dashes stripped) |
| `otp` | string | ✅ | 6-digit code |
| `source.videoId` | string | ❌ | Attribution: which video they came from |
| `source.creatorId` | string | ❌ | Attribution: which creator they followed |
| `source.inviteId` | string | ❌ | Attribution: which invite code they used |

**Response (200):**
```json
{
  "success": true,
  "isNewUser": true,
  "user": {
    "id": "uuid",
    "phoneNumber": "+1234567890",
    "userType": "FAN",
    "displayName": null,
    "username": null,
    "avatarUrl": null,
    "isOnTrial": true,
    "trialEndsAt": "2026-05-09T00:00:00.000Z",
    "coinBalance": 10,
    "createdAt": "2026-05-02T00:00:00.000Z"
  },
  "accessToken": "base64string",
  "refreshToken": "uuid"
}
```

**Errors:**
- `401` — OTP not found, expired, or already used
- `401` — OTP mismatch

---

## OTP Rules

| Rule | Detail |
|------|--------|
| Storage | PostgreSQL `otps` table — one OTP per phone number |
| Expiry | 5 minutes |
| Overwrite | New `send-otp` invalidates any previous unused OTP |
| Invalidation | OTP is deleted immediately after successful `verify-otp` |
| DEV OTP | Always last 6 digits of phone number |

---

## User Creation (New Users)

When `verify-otp` finds no existing user:

1. User is created with:
   - `phoneNumber` set
   - `email = phone_<number>@placeholder.internal` (schema requires email)
   - `userType = FAN`
   - `isOnTrial = true`, `trialEndsAt = now + 7 days`
   - `coinBalance = 10` (signup bonus)
2. Signup flow is triggered (stub — see below)
3. New session is created

---

## Signup Flow (Stub)

`AuthService.handleSignupFlow()` is called once per new user, with `source` data.

**Currently a stub** — logs to console. Full implementation should:

- [ ] Record `Attribution` entry (video / creator / invite)
- [ ] Auto-follow creator if `source.creatorId` is set
- [ ] Auto-follow creator if `source.videoId` is set
- [ ] Initialize trial tip state
- [ ] Send welcome notification

---

## Sessions & Tokens

**Access token:** Simple base64 string (`userId:timestamp`). Replace with proper JWT before production.

**Refresh token:** UUID stored as hash in `sessions` table.

**Session expiry:** 30 days. Refresh tokens are rotated per login.

---

## Database Schema

### otps

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `phoneNumber` | String | Unique |
| `otp` | String | Plain text (dev only — hash in prod) |
| `expiresAt` | DateTime | 5 minutes from creation |
| `verifiedAt` | DateTime? | Set after successful verification |
| `createdAt` | DateTime | |

### users (additions)

| Column | Type | Notes |
|--------|------|-------|
| `phoneNumber` | String? | Unique, added for OTP auth |