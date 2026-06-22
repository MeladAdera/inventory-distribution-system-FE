'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { usersApi } from '../api/users.api';
import { updateUserSchema } from '../validations/users.schema';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { User } from '../types/users.types';

type FormData = z.infer<typeof updateUserSchema>;

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ open, user, onClose, onSuccess }: EditUserModalProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(updateUserSchema) });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!user) return;
    setServerError(null);
    try {
      await usersApi.update(user.id, data);
      toast.success('User updated successfully');
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Edit User" size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label="Name" error={errors.name?.message}>
          <input {...register('name')} className="input" />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email" className="input" />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
