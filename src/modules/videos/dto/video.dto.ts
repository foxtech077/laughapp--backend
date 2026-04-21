import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MaxLength,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VideoStatus } from '@prisma/client';

export class CreateVideoDto {
  @ApiProperty({ example: 'My First Comedy Video' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'This is a hilarious video about...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'comedy,funny,laugh' })
  @IsString()
  @IsOptional()
  hashtags?: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/video.mp4' })
  @IsUrl()
  videoUrl: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/thumb.jpg' })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(3600)
  durationSeconds?: number;
}

export class UpdateVideoDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'comedy,funny' })
  @IsString()
  @IsOptional()
  hashtags?: string;

  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/new-thumb.jpg' })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: VideoStatus.REJECTED })
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;
}

export class PublishVideoDto {
  @ApiPropertyOptional({ example: '2026-04-20T12:00:00Z' })
  @IsOptional()
  scheduledAt?: Date;
}

export class FindVideosDto {
  @ApiPropertyOptional({ example: 'abc123' })
  @IsString()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional({ enum: VideoStatus })
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'publishedAt', default: 'publishedAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'publishedAt';

  @ApiPropertyOptional({ example: 'desc', default: 'desc' })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}

export class VideoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  hashtags: string | null;

  @ApiProperty()
  videoUrl: string;

  @ApiProperty()
  thumbnailUrl: string | null;

  @ApiProperty()
  durationSeconds: number | null;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;

  @ApiProperty()
  viewCount: bigint;

  @ApiProperty()
  signupCount: bigint;

  @ApiProperty()
  tipCount: bigint;

  @ApiProperty()
  tipAmount: bigint;

  @ApiProperty()
  publishedAt: Date | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedVideosResponseDto {
  @ApiProperty({ type: [VideoResponseDto] })
  data: VideoResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
