export interface Category {
  id: number;
  shop_id: number;
  name: string;
  /** Lucide icon name (e.g. "CupSoda"); null when the category has no icon set. */
  icon: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryListParams {
  shopId?: number;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name: string;
  /** Omit to leave the existing icon unchanged. */
  icon?: string;
}
