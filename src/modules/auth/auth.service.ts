import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.validatePassword(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.userType, user.username);
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      displayName: dto.displayName,
    });

    return this.generateTokens(user.id, user.email, user.userType, user.username);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);

      return this.generateTokens(user.id, user.email, user.userType, user.username);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    userType: string,
    username: string | null,
  ): Promise<AuthResponseDto> {
    const payload = { sub: userId, email, userType };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    const decoded = this.jwtService.decode(accessToken) as { exp?: number } | null;
    const expiresIn = decoded?.exp ? Math.max(0, decoded.exp - Math.floor(Date.now() / 1000)) : 0;

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: userId,
        email,
        username,
        userType,
      },
    };
  }
}
