'use client';

import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { usePermission } from '@/common/hooks/usePermission';
import { ProfileCard } from '@/features/settings/components/ProfileCard';
import { ShopCard } from '@/features/settings/components/ShopCard';
import { ChangePasswordCard } from '@/features/settings/components/ChangePasswordCard';
import type { UserRole } from '@/features/auth/types/enums';

export default function SettingsPage() {
  const { t } = useI18n();
  const p = t.settings;
  const { user } = useAuth();
  const { isShopOwner } = usePermission();

  if (!user) return null;

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <h1 className="text-[26px] font-semibold text-ink-900 mb-6">{p.page.title}</h1>

      {/* ── Cards — constrained to 672px for form readability ── */}
      <div className="max-w-2xl flex flex-col gap-4">
        <ProfileCard
          userId={Number(user.id)}
          name={user.name}
          email={user.email}
          role={user.role as UserRole}
        />

        {isShopOwner && user.shopId && <ShopCard shopId={user.shopId} />}

        <ChangePasswordCard />
      </div>
    </div>
  );
}
