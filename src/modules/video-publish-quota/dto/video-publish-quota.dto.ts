// Video publish quota DTOs
export class QuotaResponseDto {
  publishedThisDay: number;
  publishedThisWeek: number;
  dailyLimit: number;
  weeklyLimit: number;
  canPublishToday: boolean;
  canPublishWeek: boolean;
  isBlocked: boolean;
  blockedUntil: Date | null;
  blockReason: string | null;
  lastPublishedAt: Date | null;
}
