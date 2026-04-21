import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateCreatorProfileDto {
  @ApiPropertyOptional({ example: 'Stage Name' })
  @IsString()
  @IsOptional()
  stageName?: string;

  @ApiPropertyOptional({ example: 'My tagline' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({ example: 'payout@example.com' })
  @IsEmail()
  @IsOptional()
  payoutEmail?: string;
}

export class CreatorProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  stageName: string | null;

  @ApiPropertyOptional()
  tagline: string | null;

  @ApiProperty()
  totalViews: bigint;

  @ApiProperty()
  totalSignups: bigint;

  @ApiProperty()
  totalTipsReceived: bigint;

  @ApiProperty()
  totalTipAmount: bigint;

  @ApiProperty()
  totalFollowers: bigint;

  @ApiPropertyOptional()
  payoutEmail: string | null;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class CreatorStatsDto {
  @ApiProperty()
  totalViews: bigint;

  @ApiProperty()
  totalSignups: bigint;

  @ApiProperty()
  totalTipsReceived: bigint;

  @ApiProperty()
  totalTipAmount: bigint;

  @ApiProperty()
  totalFollowers: bigint;
}
