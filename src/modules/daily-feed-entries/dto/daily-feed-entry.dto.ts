// Daily feed entries DTOs
export class DailyFeedEntryDto {
  id: string;
  feedId: string;
  videoId: string;
  rank: number;
  score: number;
  viewCount: bigint | null;
  signupCount: bigint | null;
  tipCount: bigint | null;
  tipAmount: bigint | null;
  viewScore: number | null;
  signupScore: number | null;
  tipScore: number | null;
  createdAt: Date;
}
