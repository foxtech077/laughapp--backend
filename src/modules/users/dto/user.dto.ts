import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  IsBoolean,
  IsUrl,
  ValidateIf,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { UserType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Comedian and content creator' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ enum: UserType, default: UserType.FAN })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType = UserType.FAN;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'newname' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ example: 'New Display Name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-avatar.jpg' })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Updated bio' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SelectRoleDto {
  @ApiProperty({
    description: 'Role selected during onboarding',
    enum: ['FAN', 'CREATOR'],
    example: 'FAN',
  })
  @IsIn(['FAN', 'CREATOR'])
  role: 'FAN' | 'CREATOR';

  @ApiPropertyOptional({ description: 'Display name for FAN onboarding', example: 'Sandee Das' })
  @ValidateIf((o: SelectRoleDto) => o.role === 'FAN')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Unique username for FAN onboarding', example: 'sandee.das' })
  @ValidateIf((o: SelectRoleDto) => o.role === 'FAN')
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ description: 'First name for CREATOR onboarding', example: 'Alexander' })
  @ValidateIf((o: SelectRoleDto) => o.role === 'CREATOR')
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name for CREATOR onboarding', example: 'Small' })
  @ValidateIf((o: SelectRoleDto) => o.role === 'CREATOR')
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile link for CREATOR onboarding',
    example: 'https://www.instagram.com/alexandersmall',
  })
  @ValidateIf((o: SelectRoleDto) => o.role === 'CREATOR')
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  instagramLink?: string;

  @ApiPropertyOptional({ description: 'Email for CREATOR onboarding', example: 'alexandersmall94@gmail.com' })
  @ValidateIf((o: SelectRoleDto) => o.role === 'CREATOR')
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}

export class FindUsersDto {
  @ApiPropertyOptional({ enum: UserType })
  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;

  @ApiPropertyOptional({ example: 'john' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', default: 'desc' })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiProperty()
  username: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string | null;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty()
  bio: string | null;

  @ApiProperty()
  profileLink: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  coinBalance: number;

  @ApiProperty()
  isOnTrial: boolean;

  @ApiProperty()
  trialEndsAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
