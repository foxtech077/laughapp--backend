import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './common/database/prisma.module';
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
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),

    // Prisma
    PrismaModule,

    // Feature Modules
    UsersModule,
    AuthModule,
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
})
export class AppModule {}
