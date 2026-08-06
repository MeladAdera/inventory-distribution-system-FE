'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, FormField, Button, LoadingSpinner, ErrorAlert } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { buildSupplierSchema, type SupplierFormData } from '../validations/suppliers.schema';
import type { Supplier, CreateSupplierInput } from '../types/suppliers.types';

interface SupplierFormModalProps {
  open: boolean;
  /** null → create mode. */
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (data: CreateSupplierInput) => Promise<unknown>;
  labels: {
    createTitle: string;
    editTitle: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    phoneHint: string;
    note: string;
    notePlaceholder: string;
    submit: string;
    save: string;
    cancel: string;
    errNameRequired: string;
    errNameShort: string;
    errNoteLong: string;
  };
}

export function SupplierFormModal({
  open,
  supplier,
  onClose,
  onSubmit,
  labels,
}: SupplierFormModalProps) {
  const isEdit = supplier !== null;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(buildSupplierSchema(labels)),
  });

  // Refill whenever the target changes, and clear back to blank for create mode.
  useEffect(() => {
    if (!open) return;
    reset({
      name: supplier?.name ?? '',
      phone: supplier?.phone ?? '',
      note: supplier?.note ?? '',
    });
    setServerError(null);
  }, [open, supplier, reset]);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      // Send only what was filled in — never blank strings, which would clear an
      // existing phone/note on edit and trip the unique-phone check on create.
      await onSubmit({
        name: data.name.trim(),
        ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
        ...(data.note?.trim() ? { note: data.note.trim() } : {}),
      });
      onClose();
    } catch (err) {
      // Covers 409 supplier.PHONE_TAKEN — the message is already localized server-side.
      setServerError(getErrorMessage(err));
    }
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? labels.editTitle : labels.createTitle}
      size="md"
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label={labels.name} error={errors.name?.message} required>
          <input
            {...register('name')}
            placeholder={labels.namePlaceholder}
            autoFocus
            className="input"
          />
        </FormField>

        <FormField label={labels.phone} error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder={labels.phonePlaceholder}
            className="input font-mono"
          />
          <p className="mt-1 text-[12px] text-ink-400">{labels.phoneHint}</p>
        </FormField>

        <FormField label={labels.note} error={errors.note?.message}>
          <textarea
            {...register('note')}
            rows={2}
            placeholder={labels.notePlaceholder}
            className="input resize-none"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {labels.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isEdit ? labels.save : labels.submit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
