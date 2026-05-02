import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiVersion('1')
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // POST /auth/send-otp
  // ============================================================

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number (DEV: OTP = last 6 digits)' })
  @ApiResponse({ status: 200, description: 'OTP sent / logged to console' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async sendOtp(@Body() body: { phoneNumber: string }) {
    const { phoneNumber } = body;

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new BadRequestException('Valid phone number is required');
    }

    // Normalize: remove spaces, dashes
    const normalized = phoneNumber.replace(/[\s-]/g, '');

    const otp = await this.authService.generateOtp(normalized);

    // DEV MODE: always log the OTP
    console.log(`\n📱 ═══════════════════════════════`);
    console.log(`📱   OTP for ${normalized}: ${otp}`);
    console.log(`📱   Valid for 5 minutes`);
    console.log(`📱 ═══════════════════════════════\n`);

    return {
      success: true,
      message: 'OTP sent (check console in DEV mode)',
      // In production, integrate with Twilio/MessageBird/etc.
    };
  }

  // ============================================================
  // POST /auth/verify-otp
  // ============================================================

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP + login or signup new user' })
  @ApiResponse({ status: 200, description: 'Auth successful — returns tokens + user' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() body: {
      phoneNumber: string;
      otp: string;
      source?: { videoId?: string; creatorId?: string; inviteId?: string };
    },
  ) {
    const { phoneNumber, otp, source } = body;

    if (!phoneNumber || !otp) {
      throw new BadRequestException('phoneNumber and otp are required');
    }

    const normalized = phoneNumber.replace(/[\s-]/g, '');

    // 1. Find valid OTP
    const validOtp = await this.authService.findValidOtp(normalized);

    if (!validOtp) {
      throw new UnauthorizedException(
        'OTP not found, already used, or expired. Please request a new one.',
      );
    }

    // 2. Validate OTP
    if (validOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // 3. Find existing user or create new one
    let user = await this.authService.findUserByPhone(normalized);
    let isNewUser = false;

    if (!user) {
      user = await this.authService.createPhoneUser(normalized);
      isNewUser = true;

      // Trigger signup flow only once (first login)
      await this.authService.handleSignupFlow(user.id, source);
    }

    // 4. Invalidate OTP after successful verification
    await this.authService.deleteOtp(normalized);

    // 5. Generate tokens
    const { accessToken, refreshToken } = this.authService.generateTokens(user.id);

    // 6. Store session
    await this.authService.createSession(user.id, refreshToken);

    // 7. Build safe user response
    const safeUser = this.authService.buildUserResponse(user as unknown as Record<string, unknown>);

    return {
      success: true,
      isNewUser,
      user: {
        id: safeUser.id,
        phoneNumber: safeUser.phoneNumber,
        userType: safeUser.userType,
        displayName: safeUser.displayName,
        username: safeUser.username,
        avatarUrl: safeUser.avatarUrl,
        isOnTrial: safeUser.isOnTrial,
        trialEndsAt: safeUser.trialEndsAt,
        coinBalance: safeUser.coinBalance,
        createdAt: safeUser.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}

  // ============================================================
  // POST /auth/send-otp
  // ============================================================

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number (DEV: OTP = last 6 digits)' })
  @ApiResponse({ status: 200, description: 'OTP sent / logged to console' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async sendOtp(@Body() body: { phoneNumber: string }) {
    const { phoneNumber } = body;

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new BadRequestException('Valid phone number is required');
    }

    // Normalize: remove spaces, dashes
    const normalized = phoneNumber.replace(/[\s-]/g, '');

    const otp = await this.authService.generateOtp(normalized);

    // DEV MODE: always log the OTP
    console.log(`\n📱 ═══════════════════════════════`);
    console.log(`📱   OTP for ${normalized}: ${otp}`);
    console.log(`📱   Valid for 5 minutes`);
    console.log(`📱 ═══════════════════════════════\n`);

    return {
      success: true,
      message: 'OTP sent (check console in DEV mode)',
      // In production, integrate with Twilio/MessageBird/etc.
    };
  }

  // ============================================================
  // POST /auth/verify-otp
  // ============================================================

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP + login or signup new user' })
  @ApiResponse({ status: 200, description: 'Auth successful — returns tokens + user' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() body: {
      phoneNumber: string;
      otp: string;
      source?: { videoId?: string; creatorId?: string; inviteId?: string };
    },
  ) {
    const { phoneNumber, otp, source } = body;

    if (!phoneNumber || !otp) {
      throw new BadRequestException('phoneNumber and otp are required');
    }

    const normalized = phoneNumber.replace(/[\s-]/g, '');

    // 1. Find valid OTP
    const validOtp = await this.authService.findValidOtp(normalized);

    if (!validOtp) {
      throw new UnauthorizedException(
        'OTP not found, already used, or expired. Please request a new one.',
      );
    }

    // 2. Validate OTP
    if (validOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // 3. Find existing user or create new one
    let user = await this.authService.findUserByPhone(normalized);
    let isNewUser = false;

    if (!user) {
      user = await this.authService.createPhoneUser(normalized);
      isNewUser = true;

      // Trigger signup flow only once (first login)
      await this.authService.handleSignupFlow(user.id, source);
    }

    // 4. Invalidate OTP after successful verification
    await this.authService.deleteOtp(normalized);

    // 5. Generate tokens
    const { accessToken, refreshToken } = this.authService.generateTokens(user.id);

    // 6. Store session
    await this.authService.createSession(user.id, refreshToken);

    // 7. Build safe user response
    const safeUser = this.authService.buildUserResponse(user as unknown as Record<string, unknown>);

    return {
      success: true,
      isNewUser,
      user: {
        id: safeUser.id,
        phoneNumber: safeUser.phoneNumber,
        userType: safeUser.userType,
        displayName: safeUser.displayName,
        username: safeUser.username,
        avatarUrl: safeUser.avatarUrl,
        isOnTrial: safeUser.isOnTrial,
        trialEndsAt: safeUser.trialEndsAt,
        coinBalance: safeUser.coinBalance,
        createdAt: safeUser.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}