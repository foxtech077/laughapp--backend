# Laugh App — Database Diagram

> **Overview:** Laugh App is a TikTok-style platform where creators post short videos, fans watch/signup/tip, and a daily feed ranks content. Coins are the virtual currency.

---

## Entity Relationship (High-Level)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │───────│ CreatorProfile   │       │    Video     │
│  (all types) │  1:1  │  (creator-only)  │       │  (content)   │
└──────┬───────┘       └──────────────────┘       └──────┬───────┘
       │                                                   │
       │ 1:N                    1:N                       │ 1:N
       ▼                         ▼                         ▼
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    Follow    │       │       Tip        │       │   DailyFeed │
│ (who follows │───────│   (fan → video)  │       │ (daily rank) │
│    whom)     │       └──────────────────┘       └──────┬───────┘
└──────────────┘                                         │
       │                                                 │ 1:N
       │                         1:N                     ▼
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  Attribution │       │ CoinTransaction  │       │DailyFeedEntry│
│ (signup src) │       │   (ledger)        │       │ (per-video   │
└──────────────┘       └────────┬─────────┘       │  rank in feed)│
                                │                  └───────────────┘
                                │ 1:N
                        ┌───────▼────────┐    1:N   ┌──────────────┐
                        │   Purchase     │──────────│ CoinPackage  │
                        │ (coin buys)    │          │ (shop items) │
                        └────────────────┘          └──────────────┘
```

---

## Tables

### 1. `users`

The central table — every person in the app is a User.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userType` | enum | FAN | ANONYMOUS, FAN, SUPPORTER, CREATOR, ADMIN |
| `email` | String | — | Unique |
| `username` | String? | — | Unique, optional |
| `passwordHash` | String? | — | Null for anonymous/sso users |
| `displayName` | String? | — | |
| `avatarUrl` | String? | — | |
| `bio` | String? | — | |
| `profileLink` | String? | — | Unique, vanity URL slug |
| `isActive` | Boolean | true | Soft-delete flag |
| `isVerified` | Boolean | false | |
| `coinBalance` | Int | 0 | User's current coin balance |
| `trialStartedAt` | DateTime? | — | |
| `trialEndsAt` | DateTime? | — | |
| `isOnTrial` | Boolean | false | Whether user is in trial period |
| `supporterWindowStart` | DateTime? | — | When they started supporting |
| `totalSupportingAmount` | Int | 0 | Total $ spent as a fan |
| `lastActiveAt` | DateTime? | — | |
| `lastTipSentAt` | DateTime? | — | |
| `lastTipReceivedAt` | DateTime? | — | |
| `notificationSettings` | JSON | {} | |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |
| `deletedAt` | DateTime? | — | Soft delete |

**Relations:**
- 1:1 → `CreatorProfile` (only for CREATOR users)
- 1:N → `Video` (as creator)
- 1:N → `Tip` (as fan or creator)
- 1:N → `CoinTransaction`
- 1:N → `Follow` (as follower or following)
- 1:N → `Purchase`
- 1:N → `Notification`
- 1:N → `Session`
- 1:1 → `VideoPublishQuota`

---

### 2. `creator_profiles`

Extra profile data for users with `userType = CREATOR`.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users, Unique |
| `stageName` | String? | — | Creator's public name |
| `tagline` | String? | — | Short bio line |
| `totalViews` | BigInt | 0 | |
| `totalSignups` | BigInt | 0 | Signups driven by this creator |
| `totalTipsReceived` | BigInt | 0 | |
| `totalTipAmount` | BigInt | 0 | |
| `totalFollowers` | BigInt | 0 | Denormalized follower count |
| `payoutEmail` | String? | — | |
| `payoutInfo` | JSON | {} | Payout configuration |
| `isFeatured` | Boolean | false | Featured on explore page |
| `featuredAt` | DateTime? | — | |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

### 3. `videos`

Short video content posted by creators.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `creatorId` | String | — | FK → users |
| `title` | String | — | |
| `description` | String? | — | |
| `hashtags` | String? | — | Comma-separated |
| `videoUrl` | String | — | CDN URL |
| `thumbnailUrl` | String? | — | |
| `durationSeconds` | Int? | — | |
| `status` | enum | PROCESSING | PROCESSING, PUBLISHED, REJECTED, DELETED |
| `viewCount` | BigInt | 0 | |
| `uniqueViewCount` | BigInt | 0 | |
| `signupCount` | BigInt | 0 | Signups from this video |
| `tipCount` | BigInt | 0 | |
| `tipAmount` | BigInt | 0 | |
| `likeCount` | BigInt | 0 | |
| `shareCount` | BigInt | 0 | |
| `publishedAt` | DateTime? | — | When it went live |
| `scheduledAt` | DateTime? | — | For scheduled posts |
| `isActive` | Boolean | true | |
| `isFeatured` | Boolean | false | |
| `processingError` | String? | — | Error if processing failed |
| `rejectionReason` | String? | — | Why rejected (if applicable) |
| `videoMetadata` | JSON | {} | Extra metadata (resolution, etc.) |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |
| `deletedAt` | DateTime? | — | Soft delete |

---

### 4. `tips`

When a fan sends coins to a creator via a video.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `fanId` | String | — | FK → users (sender) |
| `creatorId` | String | — | FK → users (recipient) |
| `videoId` | String | — | FK → videos |
| `amount` | Int | — | Coins sent |
| `isTrialTip` | Boolean | false | Using trial credits |
| `isPostTrialTip` | Boolean | false | After trial exhausted |
| `message` | String? | — | Optional note |
| `tipSequenceInTrial` | Int? | — | Which trial tip# this was |
| `trialTipsRemaining` | Int? | — | Remaining trial tips after this |
| `createdAt` | DateTime | now() | |

**Relations:**
- FK → `users` (fan)
- FK → `users` (creator)
- FK → `videos`

---

### 5. `coin_transactions`

Immutable ledger of every coin change. `balanceAfter` is stored so we can reconstruct history without recalculating.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users |
| `amount` | Int | — | Positive = credit, Negative = debit |
| `balanceAfter` | Int | — | Balance right after this txn |
| `reason` | enum | — | TRIAL_CREDIT, PURCHASE, BONUS, TIP_SENT, TIP_RECEIVED, REFERRAL_BONUS, REFUND |
| `tipId` | String? | — | FK → tips (if reason = TIP_SENT/TIP_RECEIVED) |
| `purchaseId` | String? | — | FK → purchases |
| `bonusId` | String? | — | |
| `metadata` | JSON | {} | Extra info |
| `createdAt` | DateTime | now() | |

---

### 6. `coin_packages`

What users can buy in the shop.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `name` | String | — | e.g. "100 Coins" |
| `description` | String? | — | |
| `coinAmount` | Int | — | Base coins you get |
| `priceUsdCents` | Int | — | Price in cents (e.g. 499 = $4.99) |
| `priceUsdDisplay` | String? | — | Display string like "$4.99" |
| `bonusCoins` | Int | 0 | Extra coins as a bonus |
| `isActive` | Boolean | true | |
| `sortOrder` | Int | 0 | Display ordering |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

### 7. `purchases`

Record of coin package purchases.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users |
| `packageId` | String | — | FK → coin_packages |
| `amountPaidCents` | Int | — | Actual amount paid |
| `coinsPurchased` | Int | — | Base coins |
| `coinsBonus` | Int | 0 | Bonus coins included |
| `paymentProvider` | String? | — | e.g. "stripe" |
| `paymentProviderTxnId` | String? | — | |
| `paymentStatus` | String | PENDING | PENDING, COMPLETED, FAILED, REFUNDED |
| `createdAt` | DateTime | now() | |
| `completedAt` | DateTime? | — | |

---

### 8. `follows`

Who follows whom.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `followerId` | String | — | FK → users (the follower) |
| `followingId` | String | — | FK → users (the followed) |
| `followType` | enum | MANUAL | MANUAL, AUTO_SIGNUP |
| `sourceVideoId` | String? | — | FK → videos (what video they followed from) |
| `sourceCreatorId` | String? | — | FK → users |
| `createdAt` | DateTime | now() | |

**Constraint:** Unique on (followerId, followingId) — can't follow same person twice.

---

### 9. `daily_feeds`

One row per day — the ranked playlist shown to users.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `feedDate` | DateTime | — | Unique, the calendar date |
| `status` | enum | DRAFT | DRAFT, PUBLISHED, ARCHIVED |
| `generatedAt` | DateTime? | — | When algorithm finished |
| `publishedAt` | DateTime? | — | When it went live |
| `totalVideos` | Int | 0 | |
| `generationDurationMs` | Int? | — | How long generation took |
| `isOverride` | Boolean | false | Manual override by admin |
| `overrideReason` | String? | — | Why overridden |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

### 10. `daily_feed_entries`

Individual video entry inside a daily feed.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `feedId` | String | — | FK → daily_feeds |
| `videoId` | String | — | FK → videos |
| `rank` | Int | — | Position in feed (1 = top) |
| `score` | Float | — | Algorithm score |
| `viewCount` | BigInt? | — | Snapshot at generation time |
| `signupCount` | BigInt? | — | |
| `tipCount` | BigInt? | — | |
| `tipAmount` | BigInt? | — | |
| `viewScore` | Float? | — | |
| `signupScore` | Float? | — | |
| `tipScore` | Float? | — | |
| `createdAt` | DateTime | now() | |

**Constraints:** Unique on (feedId, rank) and (feedId, videoId).

---

### 11. `attributions`

Tracks where new users came from (which video, creator, invite link, etc.).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users (the new user) |
| `attributionType` | enum | — | VIDEO_LINK, CREATOR_PROFILE, INVITE_LINK, ORGANIC |
| `videoId` | String? | — | FK → videos |
| `creatorId` | String? | — | FK → users |
| `inviteCode` | String? | — | |
| `referringUrl` | String? | — | |
| `utmSource` | String? | — | |
| `utmMedium` | String? | — | |
| `utmCampaign` | String? | — | |
| `ipAddress` | String? | — | |
| `userAgent` | String? | — | |
| `deviceType` | String? | — | |
| `countryCode` | String? | — | |
| `city` | String? | — | |
| `createdAt` | DateTime | now() | |

---

### 12. `leaderboard_entries`

Hourly top-videos leaderboard.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `videoId` | String | — | FK → videos |
| `hourKey` | String | — | e.g. "2026-04-21-14" (hour bucket) |
| `rank` | Int | — | Position this hour |
| `score` | Float | — | |
| `viewCount` | BigInt | 0 | |
| `uniqueViewCount` | BigInt | 0 | |
| `signupCount` | BigInt | 0 | |
| `tipCount` | BigInt | 0 | |
| `tipAmount` | BigInt | 0 | |
| `updatedAt` | DateTime | — | auto |

**Constraint:** Unique on (videoId, hourKey).

---

### 13. `video_publish_quota`

Rate-limiting for how often creators can post.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `creatorId` | String | — | FK → users, Unique |
| `lastPublishedAt` | DateTime? | — | |
| `publishedThisHour` | Int | 0 | |
| `publishedThisDay` | Int | 0 | |
| `publishedThisWeek` | Int | 0 | |
| `hourlyResetAt` | DateTime? | — | |
| `dailyResetAt` | DateTime? | — | |
| `weeklyResetAt` | DateTime? | — | |
| `isBlocked` | Boolean | false | |
| `blockedUntil` | DateTime? | — | |
| `blockReason` | String? | — | |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

### 14. `notifications`

In-app (and future push/email) notifications.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users |
| `type` | String | — | e.g. "TIP_RECEIVED" |
| `title` | String? | — | |
| `body` | String? | — | |
| `data` | JSON | {} | Extra payload |
| `isRead` | Boolean | false | |
| `readAt` | DateTime? | — | |
| `channel` | String | IN_APP | IN_APP, PUSH, EMAIL |
| `createdAt` | DateTime | now() | |

---

### 15. `sessions`

User auth sessions (refresh tokens, device info).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `userId` | String | — | FK → users |
| `refreshTokenHash` | String? | — | |
| `refreshTokenExpiresAt` | DateTime? | — | |
| `ipAddress` | String? | — | |
| `userAgent` | String? | — | |
| `deviceType` | String? | — | |
| `isActive` | Boolean | true | |
| `lastActiveAt` | DateTime? | — | |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

### 16. `admin_audit_log`

Immutable log of all admin actions.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `adminUserId` | String | — | FK → users (the admin) |
| `action` | String | — | e.g. "VIDEO_REJECT" |
| `entityType` | String? | — | e.g. "Video" |
| `entityId` | String? | — | |
| `oldValues` | JSON? | — | Snapshot before |
| `newValues` | JSON? | — | Snapshot after |
| `ipAddress` | String? | — | |
| `userAgent` | String? | — | |
| `createdAt` | DateTime | now() | |

---

### 17. `rate_limits`

Simple key-value rate limit counter.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | UUID | uuid() | PK |
| `key` | String | — | Unique, e.g. "tip:user123" |
| `hits` | Int | 0 | Current count in window |
| `windowStart` | DateTime | — | |
| `windowDurationSeconds` | Int | 60 | |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | — | auto |

---

## Enums Summary

| Enum | Values |
|------|--------|
| `UserType` | ANONYMOUS, FAN, SUPPORTER, CREATOR, ADMIN |
| `AttributionType` | VIDEO_LINK, CREATOR_PROFILE, INVITE_LINK, ORGANIC |
| `VideoStatus` | PROCESSING, PUBLISHED, REJECTED, DELETED |
| `CoinTxnReason` | TRIAL_CREDIT, PURCHASE, BONUS, TIP_SENT, TIP_RECEIVED, REFERRAL_BONUS, REFUND |
| `FollowType` | MANUAL, AUTO_SIGNUP |
| `FeedStatus` | DRAFT, PUBLISHED, ARCHIVED |

---

## Key Design Patterns

### Coin Ledger (`coin_transactions`)
- Every coin change creates a new row — never update balances in-place
- `balanceAfter` stored on each row so the current balance is always just the last row
- `reason` drives business logic (can't tip if reason != TIP_SENT)

### Denormalized Counts
- `CreatorProfile.totalFollowers`, `Video.tipCount`, etc. are updated on write
- These are performance shortcuts; source of truth is the related table
- `DailyFeedEntry` snapshots counts at generation time

### Attribution
- Every new user gets an `Attribution` row capturing how they found the app
- `sourceVideoId` or `sourceCreatorId` links back to what's driving signups

### Rate Limiting
- `VideoPublishQuota` enforces per-creator posting limits (hour/day/week)
- `RateLimit` is a generic table for endpoint-level throttling
