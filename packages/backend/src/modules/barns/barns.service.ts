import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Barn, BarnDocument, BarnStatus } from '../../schemas/barn.schema';
import { Farm, FarmDocument } from '../../schemas/farm.schema';
import {
  Livestock,
  LivestockDocument,
  LivestockStatus,
} from '../../schemas/livestock.schema';
import { CreateBarnDto } from './dto/create-barn.dto';
import { UpdateBarnDto } from './dto/update-barn.dto';
import { BarnFilterDto } from './dto/barn-filter.dto';
import { BarnResponseDto } from './dto/barn-response.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class BarnsService {
  constructor(
    @InjectModel(Barn.name) private readonly barnModel: Model<BarnDocument>,
    @InjectModel(Farm.name) private readonly farmModel: Model<FarmDocument>,
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
  ) {}

  /**
   * Validate that the farm exists
   * Requirements: 5.1
   */
  private async validateFarm(farmId: string): Promise<void> {
    if (!Types.ObjectId.isValid(farmId)) {
      throw new BadRequestException('Invalid farm ID format');
    }

    const farm = await this.farmModel.findById(farmId).exec();
    if (!farm) {
      throw new BadRequestException('Farm does not exist');
    }
  }

  /**
   * Check if barn code is unique within the farm
   * Requirements: 5.1
   */
  private async validateBarnCodeUniqueness(
    code: string,
    farmId: string,
    excludeId?: string,
  ): Promise<void> {
    const query: Record<string, unknown> = {
      code,
      farmId: new Types.ObjectId(farmId),
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existing = await this.barnModel.findOne(query).exec();
    if (existing) {
      throw new ConflictException('Barn code already exists in this farm');
    }
  }

  /**
   * Create a new barn
   * Requirements: 5.1
   */
  async create(createBarnDto: CreateBarnDto): Promise<BarnResponseDto> {
    // Validate farm exists
    await this.validateFarm(createBarnDto.farmId);

    // Validate barn code uniqueness within farm
    await this.validateBarnCodeUniqueness(
      createBarnDto.code,
      createBarnDto.farmId,
    );

    const barn = new this.barnModel({
      name: createBarnDto.name,
      code: createBarnDto.code,
      capacity: createBarnDto.capacity,
      currentOccupancy: 0,
      sensors: createBarnDto.sensors || [],
      status: createBarnDto.status || BarnStatus.ACTIVE,
      farmId: new Types.ObjectId(createBarnDto.farmId),
    });

    const savedBarn = await barn.save();

    // Update farm stats
    await this.farmModel
      .findByIdAndUpdate(createBarnDto.farmId, {
        $inc: { 'stats.totalBarns': 1 },
      })
      .exec();

    return BarnResponseDto.fromDocument(savedBarn);
  }

  /**
   * Find all barns with pagination and filtering
   * Requirements: 5.2
   */
  async findAll(
    filterDto: BarnFilterDto,
  ): Promise<PaginatedResponse<BarnResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      farmId,
      status,
      search,
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (farmId) {
      if (!Types.ObjectId.isValid(farmId)) {
        throw new BadRequestException('Invalid farm ID format');
      }
      filter.farmId = new Types.ObjectId(farmId);
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [barns, total] = await Promise.all([
      this.barnModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.barnModel.countDocuments(filter).exec(),
    ]);

    const barnDtos = barns.map((barn) => BarnResponseDto.fromDocument(barn));
    return createPaginatedResponse(barnDtos, total, page, limit);
  }

  /**
   * Find a barn by ID
   * Requirements: 5.3
   */
  async findOne(id: string): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(id).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    return BarnResponseDto.fromDocument(barn);
  }

  /**
   * Find a barn by ID (returns document for internal use)
   */
  async findById(id: string): Promise<BarnDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.barnModel.findById(id).exec();
  }

  /**
   * Find a barn by code (returns document for internal use)
   * Used by monitoring service to look up barns from sensor readings
   */
  async findByCode(code: string): Promise<BarnDocument | null> {
    // Case-insensitive search for barn code
    return this.barnModel
      .findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } })
      .exec();
  }

  /**
   * Update a barn
   * Requirements: 5.1
   */
  async update(
    id: string,
    updateBarnDto: UpdateBarnDto,
  ): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(id).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    const updateData: Partial<Barn> = {};

    if (updateBarnDto.name !== undefined) {
      updateData.name = updateBarnDto.name;
    }

    if (updateBarnDto.capacity !== undefined) {
      updateData.capacity = updateBarnDto.capacity;
    }

    if (updateBarnDto.sensors !== undefined) {
      updateData.sensors = updateBarnDto.sensors;
    }

    if (updateBarnDto.status !== undefined) {
      updateData.status = updateBarnDto.status;
    }

    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Delete a barn
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(id).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    // Check if there are livestock in this barn
    const livestockCount = await this.livestockModel
      .countDocuments({
        currentBarnId: new Types.ObjectId(id),
        status: LivestockStatus.ACTIVE,
      })
      .exec();

    if (livestockCount > 0) {
      throw new BadRequestException(
        'Cannot delete barn with livestock assigned to it',
      );
    }

    await this.barnModel.findByIdAndDelete(id).exec();

    // Update farm stats
    await this.farmModel
      .findByIdAndUpdate(barn.farmId, {
        $inc: { 'stats.totalBarns': -1 },
      })
      .exec();
  }

  /**
   * Get livestock in a barn
   * Requirements: 5.3
   */
  async getLivestockInBarn(barnId: string): Promise<LivestockDocument[]> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    return this.livestockModel
      .find({
        currentBarnId: new Types.ObjectId(barnId),
        status: LivestockStatus.ACTIVE,
      })
      .exec();
  }

  /**
   * Assign a sensor to a barn
   * Requirements: 5.4
   */
  async assignSensor(
    barnId: string,
    sensorId: string,
  ): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    // Check if sensor is already assigned to this barn
    if (barn.sensors.includes(sensorId)) {
      throw new ConflictException('Sensor is already assigned to this barn');
    }

    // Add sensor to barn
    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(
        barnId,
        { $addToSet: { sensors: sensorId } },
        { new: true },
      )
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    // Update farm stats for total sensors
    await this.farmModel
      .findByIdAndUpdate(barn.farmId, {
        $inc: { 'stats.totalSensors': 1 },
      })
      .exec();

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Remove a sensor from a barn
   */
  async removeSensor(
    barnId: string,
    sensorId: string,
  ): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    // Check if sensor is assigned to this barn
    if (!barn.sensors.includes(sensorId)) {
      throw new NotFoundException('Sensor is not assigned to this barn');
    }

    // Remove sensor from barn
    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(
        barnId,
        { $pull: { sensors: sensorId } },
        { new: true },
      )
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    // Update farm stats for total sensors
    await this.farmModel
      .findByIdAndUpdate(barn.farmId, {
        $inc: { 'stats.totalSensors': -1 },
      })
      .exec();

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Update barn occupancy
   * Requirements: 5.2
   */
  async updateOccupancy(barnId: string): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    // Count active livestock in this barn
    const occupancy = await this.livestockModel
      .countDocuments({
        currentBarnId: new Types.ObjectId(barnId),
        status: LivestockStatus.ACTIVE,
      })
      .exec();

    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(barnId, { currentOccupancy: occupancy }, { new: true })
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Increment barn occupancy
   * Requirements: 5.2, 5.5
   */
  async incrementOccupancy(
    barnId: string,
    increment: number = 1,
  ): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    const newOccupancy = barn.currentOccupancy + increment;

    // Check capacity - warn but allow (Requirements: 5.5)
    if (newOccupancy > barn.capacity) {
      // Log warning but don't throw error
      console.warn(
        `Warning: Barn ${barn.code} capacity exceeded. Current: ${newOccupancy}, Capacity: ${barn.capacity}`,
      );
    }

    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(
        barnId,
        { $inc: { currentOccupancy: increment } },
        { new: true },
      )
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Decrement barn occupancy
   * Requirements: 5.2
   */
  async decrementOccupancy(
    barnId: string,
    decrement: number = 1,
  ): Promise<BarnResponseDto> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    const newOccupancy = Math.max(0, barn.currentOccupancy - decrement);

    const updatedBarn = await this.barnModel
      .findByIdAndUpdate(
        barnId,
        { currentOccupancy: newOccupancy },
        { new: true },
      )
      .exec();

    if (!updatedBarn) {
      throw new NotFoundException('Barn not found');
    }

    return BarnResponseDto.fromDocument(updatedBarn);
  }

  /**
   * Find barns by farm ID
   */
  async findByFarm(farmId: string): Promise<BarnResponseDto[]> {
    if (!Types.ObjectId.isValid(farmId)) {
      return [];
    }

    const barns = await this.barnModel
      .find({ farmId: new Types.ObjectId(farmId) })
      .exec();

    return barns.map((barn) => BarnResponseDto.fromDocument(barn));
  }

  /**
   * Check if capacity is exceeded
   * Requirements: 5.5
   */
  async isCapacityExceeded(barnId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new NotFoundException('Barn not found');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new NotFoundException('Barn not found');
    }

    return barn.currentOccupancy >= barn.capacity;
  }
}
