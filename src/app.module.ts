import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/database/prisma.module';
import { HealthController } from './health.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { VideosModule } from './modules/videos/videos.module';
import { TipsModule } from './modules/tips/tips.module';
import { FollowsModule } from './modules/follows/follows.module';
import { DailyFeedsModule } from './modules/daily-feeds/daily-feeds.module';
import { LeaderboardEntriesModule } from './modules/leaderboard-entries/leaderboard-entries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CoinTransactionsModule } from './modules/coin-transactions/coin-transactions.module';
import { CoinPackagesModule } from './modules/coin-packages/coin-packages.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CreatorProfilesModule } from './modules/creator-profiles/creator-profiles.module';
import { AttributionsModule } from './modules/attributions/attributions.module';
import { VideoPublishQuotaModule } from './modules/video-publish-quota/video-publish-quota.module';
import { AdminAuditLogModule } from './modules/admin-audit-log/admin-audit-log.module';
import { RateLimitsModule } from './modules/rate-limits/rate-limits.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  controllers: [HealthController],
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),

    // Prisma
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    VideosModule,
    TipsModule,
    FollowsModule,
    DailyFeedsModule,
    LeaderboardEntriesModule,
    NotificationsModule,
    CoinTransactionsModule,
    CoinPackagesModule,
    PurchasesModule,
    CreatorProfilesModule,
    AttributionsModule,
    VideoPublishQuotaModule,
    AdminAuditLogModule,
    RateLimitsModule,
    SessionsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
