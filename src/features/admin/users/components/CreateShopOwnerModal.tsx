'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { useToast } from '@/providers';
import { useI18n } from '@/providers/I18nProvider';
import { usersApi } from '../api/users.api';
import { getErrorMessage } from '@/common/utils/error.utils';

interface FormData {
  shopName: string;
  shopAddress?: string;
  ownerName: string;
  email: string;
  password: string;
}

interface CreateShopOwnerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateShopOwnerModal({ open, onClose, onSuccess }: CreateShopOwnerModalProps) {
  const toast = useToast();
  const { t } = useI18n();
  const m = t.users.createShopOwner;
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    shopName: z.string().min(1, m.errShopName),
    shopAddress: z.string().optional(),
    ownerName: z.string().min(1, m.errOwnerName),
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
      await usersApi.createShopOwner(data);
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

        <div className="grid grid-cols-2 gap-4">
          <FormField label={m.shopName} error={errors.shopName?.message} required>
            <input
              {...register('shopName')}
              className="input"
              placeholder={m.shopNamePlaceholder}
            />
          </FormField>
          <FormField label={m.shopAddress} error={errors.shopAddress?.message}>
            <input
              {...register('shopAddress')}
              className="input"
              placeholder={m.shopAddressPlaceholder}
            />
          </FormField>
        </div>

        <FormField label={m.ownerName} error={errors.ownerName?.message} required>
          <input
            {...register('ownerName')}
            className="input"
            placeholder={m.ownerNamePlaceholder}
          />
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
          <input
            {...register('password')}
            type="password"
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
