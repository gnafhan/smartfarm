import { UserRole, UserStatus } from '../../../schemas/user.schema';

export class TokensResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  farmId?: string;
  createdAt: Date;
  updatedAt: Date;
}
