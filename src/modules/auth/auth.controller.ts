import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ============================================================
  // POST /auth/send-otp
  // ============================================================

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number (DEV: OTP = last 6 digits)' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent / logged to console' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  async sendOtp(@Body() body: SendOtpDto) {
    const { phoneNumber } = body;

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new BadRequestException('Valid phone number is required');
    }
    const normalized = phoneNumber.replace(/[\s-]/g, '');
    const otp = await this.authService.generateOtp(normalized);

    console.log(`\n📱 ═══════════════════════════════`);
    console.log(`📱   OTP for ${normalized}: ${otp}`);
    console.log(`📱   Valid for 5 minutes`);
    console.log(`📱 ═══════════════════════════════\n`);

    return {
      success: true,
      message: 'OTP sent (check console in DEV mode)',
    };
  }

  // ============================================================
  // POST /auth/verify-otp
  // ============================================================

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP + login or signup new user' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'Auth successful — returns tokens + user' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const { phoneNumber, otp, source } = body;

    if (!phoneNumber || !otp) {
      throw new BadRequestException('phoneNumber and otp are required');
    }

    const normalized = phoneNumber.replace(/[\s-]/g, '');

    const validOtp = await this.authService.findValidOtp(normalized);
    if (!validOtp) {
      throw new UnauthorizedException(
        'OTP not found, already used, or expired. Please request a new one.',
      );
    }

    if (validOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    let user = await this.authService.findUserByPhone(normalized);
    let isNewUser = false;

    if (!user) {
      user = await this.authService.createPhoneUser(normalized);
      isNewUser = true;
      await this.authService.handleSignupFlow(user.id, source);
    }

    await this.authService.deleteOtp(normalized);
    const { accessToken, refreshToken } = this.authService.generateTokens(user.id);
    await this.authService.createSession(user.id, refreshToken);
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