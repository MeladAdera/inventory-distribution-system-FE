'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
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
  const { t } = useI18n();
  const m = t.shops.toggleStatus;
  const [isLoading, setIsLoading] = useState(false);

  const isActive = shop?.is_active ?? false;
  const name = shop?.name ?? '';

  const handleConfirm = async () => {
    if (!shop) return;
    setIsLoading(true);
    try {
      await shopsApi.updateStatus(shop.id, { isActive: !isActive });
      const msg = isActive
        ? m.toastDeactivated.replace('{name}', name)
        : m.toastActivated.replace('{name}', name);
      toast.success(msg);
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
      title={isActive ? m.deactivateTitle : m.activateTitle}
      description={
        isActive
          ? m.deactivateDescription.replace('{name}', name)
          : m.activateDescription.replace('{name}', name)
      }
      confirmLabel={isActive ? m.deactivate : m.activate}
      isLoading={isLoading}
    />
  );
}
