/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ENV: 'development' | 'test' | 'staging' | 'production';
  readonly VITE_API_BASE_URL: string;
  readonly VITE_PUBLIC_SITE_URL: string;
  readonly VITE_ORG_NAME: string;
  readonly VITE_CONTACT_EMAIL: string;
  readonly VITE_CONTACT_PHONE: string;
  readonly VITE_CONTACT_WHATSAPP_URL: string;
  readonly VITE_INSTAGRAM_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
