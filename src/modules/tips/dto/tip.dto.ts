import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTipDto {
  @ApiProperty({ example: 'uuid-of-video' })
  @IsUUID()
  videoId: string;

  @ApiPropertyOptional({ example: 'Great video! Keep it up!' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class FindTipsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  fanId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  videoId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}

export class TipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fanId: string;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  isTrialTip: boolean;

  @ApiProperty()
  isPostTrialTip: boolean;

  @ApiProperty()
  message: string | null;

  @ApiProperty()
  tipSequenceInTrial: number | null;

  @ApiProperty()
  trialTipsRemaining: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class PaginatedTipsResponseDto {
  @ApiProperty({ type: [TipResponseDto] })
  data: TipResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
