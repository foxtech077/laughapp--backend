import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { AttributionType } from '@prisma/client';

export class CreateAttributionDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: AttributionType })
  @IsString()
  attributionType: AttributionType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  videoId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  creatorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  utmCampaign?: string;
}

export class FindAttributionsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: AttributionType })
  @IsString()
  @IsOptional()
  attributionType?: AttributionType;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
