'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Phone, Store } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { useShopSettings } from '../hooks/useSettings';
import {
  CardHeader,
  CardFooter,
  InfoRow,
  FieldRow,
  inputCls,
  SkeletonBanner,
  SkeletonRow,
} from './shared';
import type { ShopCardProps, ShopFormValues } from '../types/settings.types';

// ── Sub-components ─────────────────────────────────────────────────────────

function ShopBanner({ name, type }: { name: string; type: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 bg-sand-100 border-b border-border">
      <div className="w-14 h-14 rounded-xl bg-ink-900 flex items-center justify-center shrink-0">
        <Store size={22} className="text-amber-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink-900 truncate">{name}</p>
        <span className="inline-flex items-center mt-1.5 h-5 px-2 rounded-full border text-[11px] font-medium bg-teal-50 text-teal-700 border-teal-200">
          {type}
        </span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ShopCard({ shopId }: ShopCardProps) {
  const { t } = useI18n();
  const p = t.settings.shop;
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const { shop, isLoading, updateShop, isUpdating } = useShopSettings(shopId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShopFormValues>({
    defaultValues: { name: '', address: '', phone: '' },
  });

  useEffect(() => {
    if (shop)
      reset({ name: shop.name ?? '', address: shop.address ?? '', phone: shop.phone ?? '' });
  }, [shop, reset]);

  const handleEdit = () => {
    reset({ name: shop?.name ?? '', address: shop?.address ?? '', phone: shop?.phone ?? '' });
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateShop(data);
      setEditing(false);
      toast.success(p.toast.success);
    } catch {
      toast.error(p.toast.error);
    }
  });

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      <CardHeader
        title={p.title}
        subtitle={p.subtitle}
        editLabel={p.edit}
        editing={editing || isLoading}
        onEdit={handleEdit}
      />

      {isLoading ? (
        <>
          <SkeletonBanner />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : editing ? (
        <>
          <ShopBanner name={shop?.name ?? '—'} type={shop?.type ?? 'SHOP'} />
          <form onSubmit={onSubmit} noValidate>
            <FieldRow
              label={p.name}
              icon={<Store size={14} className="text-ink-400" />}
              error={errors.name?.message}
            >
              <input
                {...register('name', { required: 'Required' })}
                className={inputCls(!!errors.name)}
                autoFocus
              />
            </FieldRow>

            <FieldRow label={p.address} icon={<MapPin size={14} className="text-ink-400" />}>
              <input {...register('address')} className={inputCls(false)} />
            </FieldRow>

            <FieldRow label={p.phone} icon={<Phone size={14} className="text-ink-400" />} last>
              <input {...register('phone')} className={inputCls(false)} />
            </FieldRow>

            <CardFooter
              saveLabel={p.save}
              cancelLabel={p.cancel}
              isSaving={isUpdating}
              onCancel={handleCancel}
            />
          </form>
        </>
      ) : (
        <>
          <ShopBanner name={shop?.name ?? '—'} type={shop?.type ?? 'SHOP'} />
          <InfoRow
            label={p.name}
            value={shop?.name ?? '—'}
            icon={<Store size={14} className="text-ink-400" />}
          />
          <InfoRow
            label={p.address}
            value={shop?.address ?? '—'}
            icon={<MapPin size={14} className="text-ink-400" />}
          />
          <InfoRow
            label={p.phone}
            value={shop?.phone ?? '—'}
            icon={<Phone size={14} className="text-ink-400" />}
            last
          />
        </>
      )}
    </div>
  );
}
