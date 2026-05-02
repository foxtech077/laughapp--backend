import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OtpSourceDto {
  @ApiPropertyOptional({
    description: 'Video ID attribution source',
    example: 'video_123',
  })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Creator ID attribution source',
    example: 'creator_123',
  })
  @IsOptional()
  @IsString()
  creatorId?: string;

  @ApiPropertyOptional({
    description: 'Invite ID/code attribution source',
    example: 'invite_123',
  })
  @IsOptional()
  @IsString()
  inviteId?: string;
}

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number used for OTP login',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number used to request OTP',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'OTP code sent to phone number',
    example: '543210',
  })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiPropertyOptional({
    description: 'Optional attribution metadata',
    type: OtpSourceDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtpSourceDto)
  source?: OtpSourceDto;
}

export class OtpResponseDto {
  success: boolean;
  message: string;
}

export class AuthResponseDto {
  success: boolean;
  isNewUser: boolean;
  user: {
    id: string;
    phoneNumber: string;
    userType: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    isOnTrial: boolean;
    trialEndsAt?: string;
    coinBalance: number;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}