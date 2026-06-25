'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Modal,
  FormField,
  Button,
  LoadingSpinner,
  ErrorAlert,
  PasswordInput,
} from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
import { usersApi } from '../api/users.api';
import { getErrorMessage } from '@/common/utils/error.utils';

interface FormData {
  name: string;
  email: string;
  password: string;
}

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEmployeeModal({ open, onClose, onSuccess }: CreateEmployeeModalProps) {
  const toast = useToast();
  const { t } = useI18n();
  const m = t.users.createEmployee;
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(1, m.errName),
    email: z.string().email({ message: m.errEmail }),
    password: z.string().min(6, m.errPassword),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await usersApi.createEmployee(data);
      toast.success(m.toastSuccess);
      reset();
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title={m.title} size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label={m.name} error={errors.name?.message} required>
          <input {...register('name')} className="input" placeholder={m.namePlaceholder} />
        </FormField>

        <FormField label={m.email} error={errors.email?.message} required>
          <input
            {...register('email')}
            type="email"
            className="input"
            placeholder={m.emailPlaceholder}
          />
        </FormField>

        <FormField label={m.password} error={errors.password?.message} required>
          <PasswordInput
            {...register('password')}
            className="input"
            placeholder={m.passwordPlaceholder}
          />
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
