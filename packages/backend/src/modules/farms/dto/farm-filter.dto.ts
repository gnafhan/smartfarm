import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { PaginatedSortedDto } from '../../../common/dto/pagination.dto';

export class FarmFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
