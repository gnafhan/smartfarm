import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokensResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { UserDocument } from '../../schemas/user.schema';
import { REDIS_CLIENT } from '../../common/providers/redis.provider';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async login(loginDto: LoginDto): Promise<TokensResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Return same error for invalid email or password to prevent enumeration
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<TokensResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Check if refresh token is in Redis (valid)
      const storedToken = await this.redisClient.get(
        `${this.REFRESH_TOKEN_PREFIX}${payload.sub}`,
      );

      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Invalidate old refresh token and generate new tokens
      await this.redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${payload.sub}`);

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToProfile(user);
  }

  async logout(userId: string): Promise<void> {
    await this.redisClient.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async generateTokens(user: UserDocument): Promise<TokensResponseDto> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const ttlSeconds = this.parseExpirationToSeconds(refreshExpiresIn);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: ttlSeconds,
    });

    // Store refresh token in Redis with expiration
    await this.redisClient.set(
      `${this.REFRESH_TOKEN_PREFIX}${user._id.toString()}`,
      refreshToken,
      'EX',
      ttlSeconds,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private mapUserToProfile(user: UserDocument): UserProfileDto {
    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      farmId: user.farmId?.toString(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60; // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}
