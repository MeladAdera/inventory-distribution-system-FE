'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
import { usersApi } from '../api/users.api';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { User } from '../types/users.types';

interface DeactivateUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeactivateUserDialog({
  open,
  user,
  onClose,
  onSuccess,
}: DeactivateUserDialogProps) {
  const toast = useToast();
  const { t } = useI18n();
  const m = t.users.deactivateUser;
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await usersApi.deactivate(user.id);
      toast.success(m.toastSuccess.replace('{name}', user.name));
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
      title={m.title}
      description={m.description.replace('{name}', user?.name ?? '')}
      confirmLabel={m.confirm}
      isLoading={isLoading}
    />
  );
}
