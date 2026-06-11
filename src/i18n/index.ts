import sidebarEn from './en/sidebar.json';
import topbarEn from './en/topbar.json';
import bottomnavEn from './en/bottomnav.json';
import dashboardEn from './en/dashboard.json';
import sidebarAr from './ar/sidebar.json';
import topbarAr from './ar/topbar.json';
import bottomnavAr from './ar/bottomnav.json';
import dashboardAr from './ar/dashboard.json';

export type Locale = 'ar' | 'en';

export const translations = {
  en: { sidebar: sidebarEn, topbar: topbarEn, bottomnav: bottomnavEn, dashboard: dashboardEn },
  ar: { sidebar: sidebarAr, topbar: topbarAr, bottomnav: bottomnavAr, dashboard: dashboardAr },
} as const;

export type AppTranslations = (typeof translations)[Locale];
