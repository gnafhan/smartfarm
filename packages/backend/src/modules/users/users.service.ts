import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserStatus } from '../../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserResponseDto } from './dto/user-response.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check email uniqueness (case-insensitive)
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const user = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      farmId: createUserDto.farmId
        ? new Types.ObjectId(createUserDto.farmId)
        : undefined,
    });

    const savedUser = await user.save();
    return UserResponseDto.fromDocument(savedUser);
  }

  async findAll(
    filterDto: UserFilterDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      role,
      status,
      search,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const userDtos = users.map((user) => UserResponseDto.fromDocument(user));
    return createPaginatedResponse(userDtos, total, page, limit);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromDocument(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<User> = {};

    if (updateUserDto.fullName !== undefined) {
      updateData.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.password !== undefined) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
    }

    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.status !== undefined) {
      updateData.status = updateUserDto.status;
    }

    if (updateUserDto.farmId !== undefined) {
      updateData.farmId = new Types.ObjectId(updateUserDto.farmId);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromDocument(updatedUser);
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<User> = {};

    // Only allow fullName and password updates for profile
    if (updateProfileDto.fullName !== undefined) {
      updateData.fullName = updateProfileDto.fullName;
    }

    if (updateProfileDto.password !== undefined) {
      updateData.password = await bcrypt.hash(
        updateProfileDto.password,
        this.SALT_ROUNDS,
      );
    }

    if (Object.keys(updateData).length === 0) {
      return UserResponseDto.fromDocument(user);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromDocument(updatedUser);
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { status: UserStatus.INACTIVE }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromDocument(updatedUser);
  }

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = {
      email: email.toLowerCase(),
    };

    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const user = await this.userModel.findOne(filter).exec();
    return !!user;
  }

  /**
   * Get all active users associated with a farm
   * Used for sending alert notifications
   * Requirements: 8.2
   */
  async findByFarm(farmId: string): Promise<UserDocument[]> {
    if (!Types.ObjectId.isValid(farmId)) {
      return [];
    }

    return this.userModel
      .find({
        farmId: new Types.ObjectId(farmId),
        status: UserStatus.ACTIVE,
      })
      .exec();
  }

  /**
   * Get email addresses of all active users associated with a farm
   * Used for sending alert notifications
   * Requirements: 8.2
   */
  async getEmailsByFarm(farmId: string): Promise<string[]> {
    const users = await this.findByFarm(farmId);
    return users.map((user) => user.email);
  }
}
