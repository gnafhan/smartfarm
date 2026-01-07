import { IsOptional, IsString, IsMongoId, IsEnum } from 'class-validator';
import { PaginatedSortedDto } from '../../../common/dto/pagination.dto';
import { BarnStatus } from '../../../schemas/barn.schema';

export class BarnFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsMongoId()
  farmId?: string;

  @IsOptional()
  @IsEnum(BarnStatus)
  status?: BarnStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
