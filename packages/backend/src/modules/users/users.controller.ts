import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';
import type { PaginatedResponse } from '../../common/dto/pagination.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user (admin only)
   * Requirements: 2.1, 2.2
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * List all users with pagination and filtering (admin only)
   * Requirements: 2.3
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() filterDto: UserFilterDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(filterDto);
  }

  /**
   * Get current user's profile
   * Requirements: 2.4
   */
  @Get('me')
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(user.sub);
  }

  /**
   * Update current user's profile (only fullName and password)
   * Requirements: 2.4
   */
  @Put('me')
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  /**
   * Get user by ID (admin only)
   * Requirements: 2.3
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * Update user by ID (admin only)
   * Requirements: 2.3
   */
  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Deactivate user by ID (admin only)
   * Requirements: 2.3
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.deactivate(id);
  }
}
