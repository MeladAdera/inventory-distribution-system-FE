import type { UserRole } from '@/features/auth/types/enums';

export interface ProfileCardProps {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface ProfileFormValues {
  name: string;
  email: string;
}

export interface ShopCardProps {
  shopId: number;
}

export interface ShopFormValues {
  name: string;
  address: string;
  phone: string;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
