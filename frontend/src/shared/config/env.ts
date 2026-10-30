type AppEnv = 'development' | 'test' | 'staging' | 'production';

function readEnv(key: keyof ImportMetaEnv, fallback: string) {
  return import.meta.env[key] || fallback;
}

export const env = {
  appName: readEnv('VITE_APP_NAME', 'Portal Web Anjos da Madrugada'),
  appEnv: readEnv('VITE_APP_ENV', 'development') as AppEnv,
  apiBaseUrl: readEnv('VITE_API_BASE_URL', 'http://localhost:3000/api'),
  publicSiteUrl: readEnv('VITE_PUBLIC_SITE_URL', 'http://localhost:5173'),
  orgName: readEnv('VITE_ORG_NAME', 'Anjos da Madrugada'),
  contactEmail: readEnv('VITE_CONTACT_EMAIL', 'contato@anjosdamadrugada.org.br'),
  contactPhone: readEnv('VITE_CONTACT_PHONE', '(51) 9 9656-8102'),
  contactWhatsappUrl: readEnv('VITE_CONTACT_WHATSAPP_URL', 'https://wa.me/5551996568102'),
  instagramUrl: readEnv(
    'VITE_INSTAGRAM_URL',
    'https://www.instagram.com/anjosdamadrugadadnh?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
  ),
} as const;

export const isProduction = env.appEnv === 'production';
export const isDevelopment = env.appEnv === 'development';
