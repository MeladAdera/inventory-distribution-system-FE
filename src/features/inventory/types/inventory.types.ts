export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  lastRestockDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryInput {
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  location: string;
}

export interface UpdateInventoryInput {
  name?: string;
  quantity?: number;
  reorderLevel?: number;
  location?: string;
}
