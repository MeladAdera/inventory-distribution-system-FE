'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { usersApi } from '../api/users.api';
import { createShopOwnerSchema } from '../validations/users.schema';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useState } from 'react';

type FormData = z.infer<typeof createShopOwnerSchema>;

interface CreateShopOwnerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateShopOwnerModal({ open, onClose, onSuccess }: CreateShopOwnerModalProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(createShopOwnerSchema) });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await usersApi.createShopOwner(data);
      toast.success('Shop owner created successfully');
      reset();
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Create Shop Owner" size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Shop Name" error={errors.shopName?.message} required>
            <input {...register('shopName')} className="input" placeholder="Downtown Retail" />
          </FormField>
          <FormField label="Shop Address" error={errors.shopAddress?.message}>
            <input {...register('shopAddress')} className="input" placeholder="123 Main St" />
          </FormField>
        </div>

        <FormField label="Owner Name" error={errors.ownerName?.message} required>
          <input {...register('ownerName')} className="input" placeholder="Jane Doe" />
        </FormField>

        <FormField label="Email" error={errors.email?.message} required>
          <input
            {...register('email')}
            type="email"
            className="input"
            placeholder="jane@example.com"
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
            Create Shop Owner
          </Button>
        </div>
      </form>
    </Modal>
  );
}
