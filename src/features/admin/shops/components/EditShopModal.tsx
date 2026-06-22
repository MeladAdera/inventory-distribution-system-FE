'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { shopsApi } from '../api/shops.api';
import { updateShopSchema } from '../validations/shops.schema';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { Shop } from '../types/shops.types';

type FormData = z.infer<typeof updateShopSchema>;

interface EditShopModalProps {
  open: boolean;
  shop: Shop | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditShopModal({ open, shop, onClose, onSuccess }: EditShopModalProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(updateShopSchema) });

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        address: shop.address ?? '',
        phone: shop.phone ?? '',
      });
    }
  }, [shop, reset]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!shop) return;
    setServerError(null);
    try {
      await shopsApi.update(shop.id, data);
      toast.success('Shop updated successfully');
      onSuccess();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Edit Shop" size="md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label="Name" error={errors.name?.message}>
          <input {...register('name')} className="input" />
        </FormField>

        <FormField label="Address" error={errors.address?.message}>
          <input {...register('address')} className="input" />
        </FormField>

        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register('phone')} className="input" />
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
