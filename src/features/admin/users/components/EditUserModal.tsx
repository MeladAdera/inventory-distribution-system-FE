'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
import { usersApi } from '../api/users.api';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { User } from '../types/users.types';

interface FormData {
  name?: string;
  email?: string;
}

interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ open, user, onClose, onSuccess }: EditUserModalProps) {
  const toast = useToast();
  const { t } = useI18n();
  const m = t.users.editUser;
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(2, m.errName).optional(),
    email: z.string().email({ message: m.errEmail }).optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
      toast.success(m.toastSuccess);
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title={m.title} size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label={m.name} error={errors.name?.message}>
          <input {...register('name')} className="input" />
        </FormField>

        <FormField label={m.email} error={errors.email?.message}>
          <input {...register('email')} type="email" className="input" />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {m.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            {m.submit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
