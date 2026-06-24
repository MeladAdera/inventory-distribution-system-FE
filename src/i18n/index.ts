import sidebarEn from './en/sidebar.json';
import topbarEn from './en/topbar.json';
import bottomnavEn from './en/bottomnav.json';
import dashboardEn from './en/dashboard.json';
import productsEn from './en/products.json';
import categoriesEn from './en/categories.json';
import clientsEn from './en/clients.json';
import transfersEn from './en/transfers.json';
import shortagesEn from './en/shortages.json';
import settingsEn from './en/settings.json';
import clientEn from './en/client.json';
import authEn from './en/auth.json';
import usersEn from './en/users.json';
import shopsEn from './en/shops.json';
import sidebarAr from './ar/sidebar.json';
import topbarAr from './ar/topbar.json';
import bottomnavAr from './ar/bottomnav.json';
import dashboardAr from './ar/dashboard.json';
import productsAr from './ar/products.json';
import categoriesAr from './ar/categories.json';
import clientsAr from './ar/clients.json';
import transfersAr from './ar/transfers.json';
import shortagesAr from './ar/shortages.json';
import settingsAr from './ar/settings.json';
import clientAr from './ar/client.json';
import authAr from './ar/auth.json';
import usersAr from './ar/users.json';
import shopsAr from './ar/shops.json';

export type Locale = 'ar' | 'en';

export const translations = {
  en: {
    sidebar: sidebarEn,
    topbar: topbarEn,
    bottomnav: bottomnavEn,
    dashboard: dashboardEn,
    products: productsEn,
    categories: categoriesEn,
    clients: clientsEn,
    transfers: transfersEn,
    shortages: shortagesEn,
    settings: settingsEn,
    client: clientEn,
    auth: authEn,
    users: usersEn,
    shops: shopsEn,
  },
  ar: {
    sidebar: sidebarAr,
    topbar: topbarAr,
    bottomnav: bottomnavAr,
    dashboard: dashboardAr,
    products: productsAr,
    categories: categoriesAr,
    clients: clientsAr,
    transfers: transfersAr,
    shortages: shortagesAr,
    settings: settingsAr,
    client: clientAr,
    auth: authAr,
    users: usersAr,
    shops: shopsAr,
  },
} as const;

export type AppTranslations = (typeof translations)[Locale];
