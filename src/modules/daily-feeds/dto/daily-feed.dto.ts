import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { FeedStatus } from '@prisma/client';

export class GenerateFeedDto {
  @ApiProperty({ example: '2026-04-19' })
  @IsDateString()
  feedDate: string;
}

export class FindFeedsDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ enum: FeedStatus })
  @IsEnum(FeedStatus)
  @IsOptional()
  status?: FeedStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;
}

export class FeedEntryDto {
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

export class FeedResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  feedDate: Date;

  @ApiProperty({ enum: FeedStatus })
  status: FeedStatus;

  @ApiProperty()
  generatedAt: Date | null;

  @ApiProperty()
  publishedAt: Date | null;

  @ApiProperty()
  totalVideos: number;

  @ApiProperty({ type: [FeedEntryDto] })
  entries: FeedEntryDto[];

  @ApiProperty()
  isOverride: boolean;

  @ApiProperty()
  createdAt: Date;
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
  hourKey: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];
}
