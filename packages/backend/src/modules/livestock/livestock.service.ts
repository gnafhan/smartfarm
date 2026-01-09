import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Livestock,
  LivestockDocument,
  LivestockStatus,
} from '../../schemas/livestock.schema';
import { Farm, FarmDocument } from '../../schemas/farm.schema';
import { Barn, BarnDocument } from '../../schemas/barn.schema';
import {
  EntryExitLog,
  EntryExitLogDocument,
} from '../../schemas/entry-exit-log.schema';
import {
  HealthEvent,
  HealthEventDocument,
} from '../../schemas/health-event.schema';
import {
  WeightEntry,
  WeightEntryDocument,
} from '../../schemas/weight-entry.schema';
import { CreateLivestockDto } from './dto/create-livestock.dto';
import { UpdateLivestockDto } from './dto/update-livestock.dto';
import { LivestockResponseDto } from './dto/livestock-response.dto';
import { LivestockFilterDto } from '../../common/dto/livestock-filter.dto';
import {
  PaginatedResponse,
  createPaginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class LivestockService {
  constructor(
    @InjectModel(Livestock.name)
    private readonly livestockModel: Model<LivestockDocument>,
    @InjectModel(Farm.name)
    private readonly farmModel: Model<FarmDocument>,
    @InjectModel(Barn.name)
    private readonly barnModel: Model<BarnDocument>,
    @InjectModel(EntryExitLog.name)
    private readonly entryExitLogModel: Model<EntryExitLogDocument>,
    @InjectModel(HealthEvent.name)
    private readonly healthEventModel: Model<HealthEventDocument>,
    @InjectModel(WeightEntry.name)
    private readonly weightEntryModel: Model<WeightEntryDocument>,
  ) {}

  /**
   * Validate that the farm exists
   * Requirements: 3.1
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
   * Validate that the barn exists
   * Requirements: 3.1
   */
  private async validateBarn(barnId: string): Promise<BarnDocument> {
    if (!Types.ObjectId.isValid(barnId)) {
      throw new BadRequestException('Invalid barn ID format');
    }

    const barn = await this.barnModel.findById(barnId).exec();
    if (!barn) {
      throw new BadRequestException('Barn does not exist');
    }

    return barn;
  }

  /**
   * Check if ear tag is unique within the farm
   * Requirements: 3.2
   */
  private async validateEarTagUniqueness(
    earTagId: string,
    farmId: string,
    excludeId?: string,
  ): Promise<void> {
    const query: Record<string, unknown> = {
      earTagId,
      farmId: new Types.ObjectId(farmId),
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existing = await this.livestockModel.findOne(query).exec();
    if (existing) {
      throw new ConflictException('Ear tag ID already exists in this farm');
    }
  }

  /**
   * Create a new livestock record
   * Requirements: 3.1, 3.2, 3.6, 3.7
   */
  async create(
    createLivestockDto: CreateLivestockDto,
  ): Promise<LivestockResponseDto> {
    // Validate farm exists
    await this.validateFarm(createLivestockDto.farmId);

    // Validate ear tag uniqueness within farm
    await this.validateEarTagUniqueness(
      createLivestockDto.earTagId,
      createLivestockDto.farmId,
    );

    // Validate barn if provided
    if (createLivestockDto.currentBarnId) {
      await this.validateBarn(createLivestockDto.currentBarnId);
    }

    // Generate unique QR code UUID
    const qrCode = uuidv4();

    const livestock = new this.livestockModel({
      earTagId: createLivestockDto.earTagId,
      qrCode,
      species: createLivestockDto.species,
      name: createLivestockDto.name,
      gender: createLivestockDto.gender,
      dateOfBirth: new Date(createLivestockDto.dateOfBirth),
      weight: createLivestockDto.weight,
      color: createLivestockDto.color,
      photos: createLivestockDto.photos || [],
      status: createLivestockDto.status || LivestockStatus.ACTIVE,
      healthStatus: createLivestockDto.healthStatus,
      currentBarnId: createLivestockDto.currentBarnId
        ? new Types.ObjectId(createLivestockDto.currentBarnId)
        : undefined,
      customFields: createLivestockDto.customFields || {},
      farmId: new Types.ObjectId(createLivestockDto.farmId),
    });

    const savedLivestock = await livestock.save();

    // Update farm stats
    await this.farmModel
      .findByIdAndUpdate(createLivestockDto.farmId, {
        $inc: { 'stats.totalLivestock': 1 },
      })
      .exec();

    // Update barn occupancy if assigned to a barn
    if (createLivestockDto.currentBarnId) {
      await this.barnModel
        .findByIdAndUpdate(createLivestockDto.currentBarnId, {
          $inc: { currentOccupancy: 1 },
        })
        .exec();
    }

    return LivestockResponseDto.fromDocument(savedLivestock);
  }

  /**
   * Find all livestock with pagination and filtering
   * Requirements: 3.3
   */
  async findAll(
    filterDto: LivestockFilterDto,
  ): Promise<PaginatedResponse<LivestockResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      farmId,
      status,
      species,
      barnId,
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

    if (species) {
      filter.species = species;
    }

    if (barnId) {
      if (!Types.ObjectId.isValid(barnId)) {
        throw new BadRequestException('Invalid barn ID format');
      }
      filter.currentBarnId = new Types.ObjectId(barnId);
    }

    // Search by name or ear tag
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { earTagId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [livestock, total] = await Promise.all([
      this.livestockModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.livestockModel.countDocuments(filter).exec(),
    ]);

    const livestockDtos = livestock.map((l) =>
      LivestockResponseDto.fromDocument(l),
    );
    return createPaginatedResponse(livestockDtos, total, page, limit);
  }

  /**
   * Find a livestock by ID
   * Requirements: 3.3
   */
  async findOne(id: string): Promise<LivestockResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(id).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    return LivestockResponseDto.fromDocument(livestock);
  }

  /**
   * Find a livestock by ID (returns document for internal use)
   */
  async findById(id: string): Promise<LivestockDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.livestockModel.findById(id).exec();
  }

  /**
   * Find a livestock by QR code
   * Requirements: 4.2, 4.3
   */
  async findByQrCode(qrCode: string): Promise<LivestockDocument | null> {
    return this.livestockModel.findOne({ qrCode }).exec();
  }

  /**
   * Update a livestock record
   * Requirements: 3.4, 3.6
   */
  async update(
    id: string,
    updateLivestockDto: UpdateLivestockDto,
  ): Promise<LivestockResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(id).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    const updateData: Partial<Livestock> = {};

    if (updateLivestockDto.species !== undefined) {
      updateData.species = updateLivestockDto.species;
    }

    if (updateLivestockDto.name !== undefined) {
      updateData.name = updateLivestockDto.name;
    }

    if (updateLivestockDto.gender !== undefined) {
      updateData.gender = updateLivestockDto.gender;
    }

    if (updateLivestockDto.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(updateLivestockDto.dateOfBirth);
    }

    if (updateLivestockDto.weight !== undefined) {
      updateData.weight = updateLivestockDto.weight;
    }

    if (updateLivestockDto.color !== undefined) {
      updateData.color = updateLivestockDto.color;
    }

    if (updateLivestockDto.photos !== undefined) {
      updateData.photos = updateLivestockDto.photos;
    }

    if (updateLivestockDto.status !== undefined) {
      updateData.status = updateLivestockDto.status;
    }

    if (updateLivestockDto.healthStatus !== undefined) {
      updateData.healthStatus = updateLivestockDto.healthStatus;
    }

    // Handle barn assignment change
    if (updateLivestockDto.currentBarnId !== undefined) {
      const oldBarnId = livestock.currentBarnId?.toString();
      const newBarnId = updateLivestockDto.currentBarnId;

      if (newBarnId) {
        await this.validateBarn(newBarnId);
      }

      // Update barn occupancies if barn changed
      if (oldBarnId !== newBarnId) {
        if (oldBarnId) {
          await this.barnModel
            .findByIdAndUpdate(oldBarnId, {
              $inc: { currentOccupancy: -1 },
            })
            .exec();
        }
        if (newBarnId) {
          await this.barnModel
            .findByIdAndUpdate(newBarnId, {
              $inc: { currentOccupancy: 1 },
            })
            .exec();
        }
      }

      // Set the currentBarnId in update data
      if (newBarnId) {
        Object.assign(updateData, {
          currentBarnId: new Types.ObjectId(newBarnId),
        });
      } else {
        Object.assign(updateData, { currentBarnId: null });
      }
    }

    // Handle custom fields - merge with existing
    if (updateLivestockDto.customFields !== undefined) {
      updateData.customFields = {
        ...livestock.customFields,
        ...updateLivestockDto.customFields,
      };
    }

    const updatedLivestock = await this.livestockModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedLivestock) {
      throw new NotFoundException('Livestock not found');
    }

    return LivestockResponseDto.fromDocument(updatedLivestock);
  }

  /**
   * Soft delete a livestock record
   * Requirements: 3.5, 5.5, 5.6
   * 
   * Implements cascade delete strategy:
   * - Deletes all associated health events
   * - Deletes all associated weight entries
   * - Sets livestock status to DECEASED
   * - Updates barn occupancy
   */
  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(id).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    try {
      // Cascade delete: Remove all associated health events
      await this.healthEventModel
        .deleteMany({ livestockId: new Types.ObjectId(id) })
        .exec();

      // Cascade delete: Remove all associated weight entries
      await this.weightEntryModel
        .deleteMany({ livestockId: new Types.ObjectId(id) })
        .exec();

      // Soft delete by setting status to deceased
      await this.livestockModel
        .findByIdAndUpdate(id, { status: LivestockStatus.DECEASED })
        .exec();

      // Update barn occupancy if was assigned to a barn
      if (livestock.currentBarnId) {
        await this.barnModel
          .findByIdAndUpdate(livestock.currentBarnId, {
            $inc: { currentOccupancy: -1 },
          })
          .exec();
      }

      // Note: We don't decrement farm stats as the livestock still exists (soft delete)
    } catch (error) {
      throw new BadRequestException(
        'Failed to delete livestock: ' + (error as Error).message,
      );
    }
  }

  /**
   * Add photos to livestock
   * Requirements: 3.7
   */
  async addPhotos(
    id: string,
    photoUrls: string[],
  ): Promise<LivestockResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(id).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    const updatedLivestock = await this.livestockModel
      .findByIdAndUpdate(
        id,
        { $push: { photos: { $each: photoUrls } } },
        { new: true },
      )
      .exec();

    if (!updatedLivestock) {
      throw new NotFoundException('Livestock not found');
    }

    return LivestockResponseDto.fromDocument(updatedLivestock);
  }

  /**
   * Remove a photo from livestock
   * Requirements: 3.7
   */
  async removePhoto(
    id: string,
    photoUrl: string,
  ): Promise<LivestockResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(id).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    const updatedLivestock = await this.livestockModel
      .findByIdAndUpdate(id, { $pull: { photos: photoUrl } }, { new: true })
      .exec();

    if (!updatedLivestock) {
      throw new NotFoundException('Livestock not found');
    }

    return LivestockResponseDto.fromDocument(updatedLivestock);
  }

  /**
   * Get public livestock info by QR code
   * Requirements: 4.2, 4.3
   */
  async getPublicInfo(qrCode: string): Promise<{
    livestock: LivestockResponseDto;
    barn: { id: string; name: string; code: string } | null;
    recentLogs: EntryExitLogDocument[];
  }> {
    const livestock = await this.livestockModel.findOne({ qrCode }).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    let barn: { id: string; name: string; code: string } | null = null;
    if (livestock.currentBarnId) {
      const barnDoc = await this.barnModel
        .findById(livestock.currentBarnId)
        .exec();
      if (barnDoc) {
        barn = {
          id: barnDoc._id.toString(),
          name: barnDoc.name,
          code: barnDoc.code,
        };
      }
    }

    // Get recent entry/exit logs (last 10)
    const recentLogs = await this.entryExitLogModel
      .find({ livestockId: livestock._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .exec();

    return {
      livestock: LivestockResponseDto.fromDocument(livestock),
      barn,
      recentLogs,
    };
  }

  /**
   * Find livestock by farm ID
   */
  async findByFarm(farmId: string): Promise<LivestockResponseDto[]> {
    if (!Types.ObjectId.isValid(farmId)) {
      return [];
    }

    const livestock = await this.livestockModel
      .find({ farmId: new Types.ObjectId(farmId) })
      .exec();

    return livestock.map((l) => LivestockResponseDto.fromDocument(l));
  }

  /**
   * Find livestock by barn ID
   */
  async findByBarn(barnId: string): Promise<LivestockResponseDto[]> {
    if (!Types.ObjectId.isValid(barnId)) {
      return [];
    }

    const livestock = await this.livestockModel
      .find({
        currentBarnId: new Types.ObjectId(barnId),
        status: LivestockStatus.ACTIVE,
      })
      .exec();

    return livestock.map((l) => LivestockResponseDto.fromDocument(l));
  }

  /**
   * Update livestock barn assignment
   * Used by entry/exit module
   */
  async updateBarnAssignment(
    livestockId: string,
    barnId: string | null,
  ): Promise<LivestockResponseDto> {
    if (!Types.ObjectId.isValid(livestockId)) {
      throw new NotFoundException('Livestock not found');
    }

    const livestock = await this.livestockModel.findById(livestockId).exec();
    if (!livestock) {
      throw new NotFoundException('Livestock not found');
    }

    const oldBarnId = livestock.currentBarnId?.toString();

    // Update barn occupancies
    if (oldBarnId !== barnId) {
      if (oldBarnId) {
        await this.barnModel
          .findByIdAndUpdate(oldBarnId, {
            $inc: { currentOccupancy: -1 },
          })
          .exec();
      }
      if (barnId) {
        await this.barnModel
          .findByIdAndUpdate(barnId, {
            $inc: { currentOccupancy: 1 },
          })
          .exec();
      }
    }

    const updatedLivestock = await this.livestockModel
      .findByIdAndUpdate(
        livestockId,
        {
          currentBarnId: barnId ? new Types.ObjectId(barnId) : null,
        },
        { new: true },
      )
      .exec();

    if (!updatedLivestock) {
      throw new NotFoundException('Livestock not found');
    }

    return LivestockResponseDto.fromDocument(updatedLivestock);
  }
}
