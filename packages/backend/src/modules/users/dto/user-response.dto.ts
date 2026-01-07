import {
  UserRole,
  UserStatus,
  UserDocument,
} from '../../../schemas/user.schema';

export class UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  farmId?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromDocument(user: UserDocument): UserResponseDto {
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
}
