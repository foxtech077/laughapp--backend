# Signup Flow (OTP First-Time User)

This document describes the new post-signup flow that runs after OTP verification creates a user for the first time.

## Entry Point

- Method: `SignupService.handleSignupFlow(user, source)`
- Trigger: only in `POST /auth/verify-otp` when no existing user is found and a new user is created
- Source currently supports:
  - `creatorId` (optional)
  - `videoId` (optional)
  - `inviteId` (optional)

## URL-Style Attribution Examples

Frontend can use URL-style links such as:

- Creator profile URL:
  - `https://laughapp.com/u/john-8f23ab1c`
- Video URL:
  - `https://laughapp.com/v/2d8f1a9b-video-id`
- Invite URL:
  - `https://laughapp.com/invite/john-8f23ab1c`
  - `https://laughapp.com/invite?creatorId=<creator-user-id>`

Example payloads for `POST /api/v1/auth/verify-otp`:

```json
{
  "phoneNumber": "+919876543210",
  "otp": "543210",
  "source": {
    "creatorId": "a4b7c2d1-creator-user-id"
  }
}
```

```json
{
  "phoneNumber": "+919876543210",
  "otp": "543210",
  "source": {
    "videoId": "2d8f1a9b-video-id"
  }
}
```

```json
{
  "phoneNumber": "+919876543210",
  "otp": "543210",
  "source": {
    "inviteId": "https://laughapp.com/u/john-8f23ab1c"
  }
}
```

Notes:

- Current implementation resolves URL/string parsing in `inviteId`.
- `creatorId` and `videoId` are currently expected as direct IDs.

## What the Flow Does

For a newly created user, the flow performs:

1. Trial activation
   - `trialStartedAt = now`
   - `trialEndsAt = now + 7 days`
   - `isOnTrial = true`

2. Attribution capture (if `creatorId` exists and is valid)
   - Creates attribution with:
     - `userId`
     - `attributionType = CREATOR_PROFILE`
     - `creatorId`

3. Auto-follow creator (if `creatorId` exists and is valid)
   - Creates follow record:
     - `followerId = user.id`
     - `followingId = creatorId`
     - `followType = AUTO_SIGNUP`
   - Increments creator follower count (`creator_profiles.total_followers`) only when follow is newly created

4. Signup bonus credit (ledger)
   - Adds `10` coins to `users.coin_balance`
   - Creates `coin_transactions` record:
     - `reason = BONUS`
     - `amount = 10`
     - `bonusId = SIGNUP_BONUS:<userId>`
     - `metadata.source = SIGNUP_BONUS`
     - `metadata.type = CREDIT`

## Idempotency Rules

The flow is designed to be safe on retries:

- Primary idempotency anchor is the signup bonus ledger record (`bonusId = SIGNUP_BONUS:<userId>`).
- If signup bonus already exists, `handleSignupFlow` returns early.
- Attribution is created only when a creator attribution for that user does not already exist.
- Follow creation is protected by existing unique constraint on `(followerId, followingId)`.
- Bonus credit step re-checks existing bonus before writing.
- Trial activation skips update when trial fields are already set.

## Module / File Changes

- New module:
  - `src/modules/signup/signup.module.ts`
  - `src/modules/signup/signup.service.ts`
- Auth integration:
  - `src/modules/auth/auth.module.ts` imports `SignupModule`
  - `src/modules/auth/services/auth.service.ts` delegates signup flow to `SignupService`
  - `src/modules/auth/auth.controller.ts` calls signup flow only for newly created users

## Important Runtime Note (Neon Pooler)

The implementation intentionally avoids Prisma interactive transaction callbacks (`prisma.$transaction(async (tx) => ...)`) for this flow.

Reason: with pooled Neon connections, interactive transactions can fail with `Transaction not found` when connection pinning is not preserved across callback operations.

Current flow uses regular Prisma operations with idempotency guards to remain safe and retry-friendly.
