// Rate limits DTOs
export class CheckRateLimitDto {
  key: string;
  limit: number;
  windowSeconds: number;
}

export class RateLimitResponseDto {
  allowed: boolean;
  remaining: number;
}
