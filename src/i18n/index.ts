import sidebarEn from './en/sidebar.json';
import topbarEn from './en/topbar.json';
import bottomnavEn from './en/bottomnav.json';
import sidebarAr from './ar/sidebar.json';
import topbarAr from './ar/topbar.json';
import bottomnavAr from './ar/bottomnav.json';

export type Locale = 'ar' | 'en';

export const translations = {
  en: { sidebar: sidebarEn, topbar: topbarEn, bottomnav: bottomnavEn },
  ar: { sidebar: sidebarAr, topbar: topbarAr, bottomnav: bottomnavAr },
} as const;

export type AppTranslations = (typeof translations)[Locale];
