import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class FollowDto {
  @ApiProperty({ example: 'uuid-of-creator' })
  @IsUUID()
  followingId: string;
}

export class FindFollowsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  followerId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  followingId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
