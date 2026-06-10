export interface Category {
  id: number;
  shop_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryListParams {
  shopId?: number;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}
