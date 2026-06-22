'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/common/components';
import { useToast } from '@/providers';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await usersApi.deactivate(user.id);
      toast.success(`${user.name} has been deactivated`);
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
      title="Deactivate User"
      description={`Are you sure you want to deactivate ${user?.name ?? 'this user'}? They will no longer be able to log in.`}
      confirmLabel="Deactivate"
      isLoading={isLoading}
    />
  );
}
