import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'TIP_RECEIVED' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'You received a tip!' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'John just tipped you 5 coins' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 'IN_APP' })
  @IsString()
  @IsOptional()
  channel?: string;
}

export class FindNotificationsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  unreadOnly?: boolean;
}

export class MarkReadDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  notificationIds?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  markAll?: boolean;
}
