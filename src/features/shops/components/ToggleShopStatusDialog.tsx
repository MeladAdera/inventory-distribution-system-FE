'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/common/components';
import { useToast } from '@/providers';
import { shopsApi } from '../api/shops.api';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { Shop } from '../types/shops.types';

interface ToggleShopStatusDialogProps {
  open: boolean;
  shop: Shop | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ToggleShopStatusDialog({
  open,
  shop,
  onClose,
  onSuccess,
}: ToggleShopStatusDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isActive = shop?.is_active ?? false;
  const action = isActive ? 'Deactivate' : 'Activate';

  const handleConfirm = async () => {
    if (!shop) return;
    setIsLoading(true);
    try {
      await shopsApi.updateStatus(shop.id, { isActive: !isActive });
      toast.success(`${shop.name} has been ${isActive ? 'deactivated' : 'activated'}`);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`${action} Shop`}
      description={`Are you sure you want to ${action.toLowerCase()} "${shop?.name ?? 'this shop'}"?`}
      confirmLabel={action}
      isLoading={isLoading}
    />
  );
}
