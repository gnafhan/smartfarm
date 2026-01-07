import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginatedSortedDto } from '../../../common/dto/pagination.dto';
import { UserRole, UserStatus } from '../../../schemas/user.schema';

export class UserFilterDto extends PaginatedSortedDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
