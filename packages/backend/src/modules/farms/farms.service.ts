import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Farm, FarmDocument } from '../../schemas/farm.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmFilterDto } from './dto/farm-filter.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class FarmsService {
  constructor(
    @InjectModel(Farm.name) private readonly farmModel: Model<FarmDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Validate that the owner exists in the system
   * Requirements: 12.1
   */
  private async validateOwner(ownerId: string): Promise<void> {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner ID format');
    }

    const owner = await this.userModel.findById(ownerId).exec();
    if (!owner) {
      throw new BadRequestException('Owner user does not exist');
    }
  }

  /**
   * Create a new farm
   * Requirements: 12.1
   */
  async create(createFarmDto: CreateFarmDto): Promise<FarmResponseDto> {
    // Validate owner exists
    await this.validateOwner(createFarmDto.ownerId);

    const farm = new this.farmModel({
      name: createFarmDto.name,
      ownerId: new Types.ObjectId(createFarmDto.ownerId),
      address: createFarmDto.address,
      contactInfo: createFarmDto.contactInfo || {},
      stats: {
        totalLivestock: 0,
        totalBarns: 0,
        totalSensors: 0,
      },
    });

    const savedFarm = await farm.save();
    return FarmResponseDto.fromDocument(savedFarm);
  }

  /**
   * Find all farms with pagination and filtering
   * Requirements: 12.3
   */
  async findAll(
    filterDto: FarmFilterDto,
  ): Promise<PaginatedResponse<FarmResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      ownerId,
      search,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (ownerId) {
      if (!Types.ObjectId.isValid(ownerId)) {
        throw new BadRequestException('Invalid owner ID format');
      }
      filter.ownerId = new Types.ObjectId(ownerId);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [farms, total] = await Promise.all([
      this.farmModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.farmModel.countDocuments(filter).exec(),
    ]);

    const farmDtos = farms.map((farm) => FarmResponseDto.fromDocument(farm));
    return createPaginatedResponse(farmDtos, total, page, limit);
  }

  /**
   * Find a farm by ID
   * Requirements: 12.3
   */
  async findOne(id: string): Promise<FarmResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Farm not found');
    }

    const farm = await this.farmModel.findById(id).exec();
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    return FarmResponseDto.fromDocument(farm);
  }

  /**
   * Find a farm by ID (returns document for internal use)
   */
  async findById(id: string): Promise<FarmDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.farmModel.findById(id).exec();
  }

  /**
   * Update a farm
   * Requirements: 12.1
   */
  async update(
    id: string,
    updateFarmDto: UpdateFarmDto,
  ): Promise<FarmResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Farm not found');
    }

    const farm = await this.farmModel.findById(id).exec();
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    // Validate new owner if provided
    if (updateFarmDto.ownerId) {
      await this.validateOwner(updateFarmDto.ownerId);
    }

    const updateData: Partial<Farm> = {};

    if (updateFarmDto.name !== undefined) {
      updateData.name = updateFarmDto.name;
    }

    if (updateFarmDto.ownerId !== undefined) {
      updateData.ownerId = new Types.ObjectId(updateFarmDto.ownerId);
    }

    if (updateFarmDto.address !== undefined) {
      updateData.address = updateFarmDto.address;
    }

    if (updateFarmDto.contactInfo !== undefined) {
      updateData.contactInfo = {
        ...farm.contactInfo,
        ...updateFarmDto.contactInfo,
      };
    }

    const updatedFarm = await this.farmModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedFarm) {
      throw new NotFoundException('Farm not found');
    }

    return FarmResponseDto.fromDocument(updatedFarm);
  }

  /**
   * Delete a farm
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Farm not found');
    }

    const result = await this.farmModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Farm not found');
    }
  }

  /**
   * Update farm statistics
   * Requirements: 12.2
   */
  async updateStats(
    id: string,
    stats: {
      totalLivestock?: number;
      totalBarns?: number;
      totalSensors?: number;
    },
  ): Promise<FarmResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Farm not found');
    }

    const farm = await this.farmModel.findById(id).exec();
    if (!farm) {
      throw new NotFoundException('Farm not found');
    }

    const updateData: Record<string, number> = {};

    if (stats.totalLivestock !== undefined) {
      updateData['stats.totalLivestock'] = stats.totalLivestock;
    }

    if (stats.totalBarns !== undefined) {
      updateData['stats.totalBarns'] = stats.totalBarns;
    }

    if (stats.totalSensors !== undefined) {
      updateData['stats.totalSensors'] = stats.totalSensors;
    }

    const updatedFarm = await this.farmModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updatedFarm) {
      throw new NotFoundException('Farm not found');
    }

    return FarmResponseDto.fromDocument(updatedFarm);
  }

  /**
   * Increment farm statistics
   * Requirements: 12.2
   */
  async incrementStats(
    id: string,
    increments: {
      totalLivestock?: number;
      totalBarns?: number;
      totalSensors?: number;
    },
  ): Promise<FarmResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Farm not found');
    }

    const incData: Record<string, number> = {};

    if (increments.totalLivestock !== undefined) {
      incData['stats.totalLivestock'] = increments.totalLivestock;
    }

    if (increments.totalBarns !== undefined) {
      incData['stats.totalBarns'] = increments.totalBarns;
    }

    if (increments.totalSensors !== undefined) {
      incData['stats.totalSensors'] = increments.totalSensors;
    }

    const updatedFarm = await this.farmModel
      .findByIdAndUpdate(id, { $inc: incData }, { new: true })
      .exec();

    if (!updatedFarm) {
      throw new NotFoundException('Farm not found');
    }

    return FarmResponseDto.fromDocument(updatedFarm);
  }

  /**
   * Get farms by owner ID
   */
  async findByOwner(ownerId: string): Promise<FarmResponseDto[]> {
    if (!Types.ObjectId.isValid(ownerId)) {
      return [];
    }

    const farms = await this.farmModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .exec();

    return farms.map((farm) => FarmResponseDto.fromDocument(farm));
  }
}
