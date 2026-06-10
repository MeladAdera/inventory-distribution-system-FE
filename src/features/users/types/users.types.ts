import { UserRole } from '@/features/auth/types/enums';

export interface User {
  id: number;
  shop_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  shop_id?: number;
  search?: string;
}

export interface CreateShopOwnerInput {
  shopName: string;
  shopAddress?: string;
  ownerName: string;
  email: string;
  password: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}
