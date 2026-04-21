import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetLeaderboardDto {
  @ApiPropertyOptional({ example: '2026-04-19-14' })
  @IsString()
  @IsOptional()
  hourKey?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;
}

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  score: number;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  thumbnailUrl: string | null;

  @ApiProperty()
  creator: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };

  @ApiProperty()
  viewCount: bigint;

  @ApiProperty()
  signupCount: bigint;

  @ApiProperty()
  tipCount: bigint;

  @ApiProperty()
  tipAmount: bigint;
}

export class LeaderboardResponseDto {
  @ApiProperty()
  hourKey: string | null;

  @ApiProperty()
  generatedAt: Date | null;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
