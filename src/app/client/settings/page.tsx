'use client';

import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { usePermission } from '@/common/hooks/usePermission';
import { ProfileCard } from '@/features/settings/components/ProfileCard';
import { ShopCard } from '@/features/settings/components/ShopCard';
import type { UserRole } from '@/features/auth/types/enums';

export default function ClientSettingsPage() {
  const { t } = useI18n();
  const p = t.settings;
  const { user } = useAuth();
  const { isShopOwner } = usePermission();

  if (!user) return null;

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      <h1 className="text-[26px] font-semibold text-ink-900 mb-6">{p.page.title}</h1>

      <div className="max-w-2xl flex flex-col gap-4">
        <ProfileCard
          userId={Number(user.id)}
          name={user.name}
          email={user.email}
          role={user.role as UserRole}
        />

        {isShopOwner && user.shopId && <ShopCard shopId={user.shopId} />}
      </div>
    </div>
  );
}
