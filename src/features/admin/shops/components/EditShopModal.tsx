'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
import { shopsApi } from '../api/shops.api';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { Shop } from '../types/shops.types';

interface FormData {
  name?: string;
  address?: string;
  phone?: string;
}

interface EditShopModalProps {
  open: boolean;
  shop: Shop | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditShopModal({ open, shop, onClose, onSuccess }: EditShopModalProps) {
  const toast = useToast();
  const { t } = useI18n();
  const m = t.shops.editShop;
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(2, m.errName).optional(),
    address: z.string().min(1, m.errAddress).optional(),
    phone: z.string().min(1, m.errPhone).optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

        <FormField label={m.address} error={errors.address?.message}>
          <input {...register('address')} className="input" />
        </FormField>

        <FormField label={m.phone} error={errors.phone?.message}>
          <input {...register('phone')} className="input" />
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
