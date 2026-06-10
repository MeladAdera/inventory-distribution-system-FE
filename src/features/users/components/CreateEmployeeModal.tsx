'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { usersApi } from '../api/users.api';
import { createEmployeeSchema } from '../validations/users.schema';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useState } from 'react';

type FormData = z.infer<typeof createEmployeeSchema>;

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEmployeeModal({ open, onClose, onSuccess }: CreateEmployeeModalProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(createEmployeeSchema) });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await usersApi.createEmployee(data);
      toast.success('Employee created successfully');
      reset();
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Create Employee" size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label="Name" error={errors.name?.message} required>
          <input {...register('name')} className="input" placeholder="Bob Smith" />
        </FormField>

        <FormField label="Email" error={errors.email?.message} required>
          <input
            {...register('email')}
            type="email"
            className="input"
            placeholder="bob@example.com"
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          <input
            {...register('password')}
            type="password"
            className="input"
            placeholder="••••••••"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            Create Employee
          </Button>
        </div>
      </form>
    </Modal>
  );
}
