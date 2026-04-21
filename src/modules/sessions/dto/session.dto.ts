import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class SessionResponseDto {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceType: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  refreshTokenExpiresAt: Date | null;
}
