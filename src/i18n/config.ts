import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import sidebarEn from './en/sidebar.json';
import topbarEn from './en/topbar.json';
import bottomnavEn from './en/bottomnav.json';

import sidebarAr from './ar/sidebar.json';
import topbarAr from './ar/topbar.json';
import bottomnavAr from './ar/bottomnav.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        sidebar: sidebarEn,
        topbar: topbarEn,
        bottomnav: bottomnavEn,
      },
      ar: {
        sidebar: sidebarAr,
        topbar: topbarAr,
        bottomnav: bottomnavAr,
      },
    },
    lng: 'ar',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
