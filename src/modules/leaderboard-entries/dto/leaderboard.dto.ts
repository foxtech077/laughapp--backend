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
