'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { cn } from '@/common/utils/cn';
import { useProfileSettings } from '../hooks/useSettings';
import { CardHeader, CardFooter, InfoRow, FieldRow, inputCls } from './shared';
import { ROLE_BADGE_CLS, getInitials } from '../utils/profile.utils';
import type { ProfileCardProps, ProfileFormValues } from '../types/settings.types';
import type { UserRole } from '@/features/auth/types/enums';

// ── Sub-components ─────────────────────────────────────────────────────────

function RoleBadge({ role, label }: { role: UserRole; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded-full border text-[11px] font-medium',
        ROLE_BADGE_CLS[role]
      )}
    >
      {label}
    </span>
  );
}

function ProfileBanner({
  name,
  email,
  role,
  roleLabel,
}: {
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 bg-sand-100 border-b border-border">
      <div className="w-14 h-14 rounded-full bg-ink-900 flex items-center justify-center shrink-0">
        <span className="text-[18px] font-bold text-amber-500 tracking-wide">
          {getInitials(name)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink-900 truncate">{name}</p>
        <p className="text-[13px] text-ink-500 truncate mt-0.5">{email}</p>
        <div className="mt-2">
          <RoleBadge role={role} label={roleLabel} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ProfileCard({ userId, name, email, role }: ProfileCardProps) {
  const { t } = useI18n();
  const p = t.settings.profile;
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const { updateProfile, isUpdating } = useProfileSettings(userId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: { name, email },
  });

  const handleEdit = () => {
    reset({ name, email });
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateProfile(data);
      setEditing(false);
      toast.success(p.toast.success);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      <CardHeader
        title={p.title}
        subtitle={p.subtitle}
        editLabel={p.edit}
        editing={editing}
        onEdit={handleEdit}
      />

      <ProfileBanner name={name} email={email} role={role} roleLabel={p.roles[role]} />

      {editing ? (
        <form onSubmit={onSubmit} noValidate>
          <FieldRow label={p.name} error={errors.name?.message}>
            <input
              {...register('name', { required: 'Required' })}
              className={inputCls(!!errors.name)}
              autoFocus
            />
          </FieldRow>

          <FieldRow label={p.email} error={errors.email?.message} last>
            <input
              type="email"
              {...register('email', { required: 'Required' })}
              className={inputCls(!!errors.email)}
            />
          </FieldRow>

          <CardFooter
            saveLabel={p.save}
            cancelLabel={p.cancel}
            isSaving={isUpdating}
            onCancel={handleCancel}
          />
        </form>
      ) : (
        <>
          <InfoRow label={p.name} value={name} />
          <InfoRow label={p.email} value={email} />
          <InfoRow label={p.role} value={<RoleBadge role={role} label={p.roles[role]} />} last />
        </>
      )}
    </div>
  );
}
