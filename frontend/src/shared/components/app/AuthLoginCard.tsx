import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';

import logoAnjos from '@/assets/images/logo_anjos.png';
import { env } from '@/shared/config/env';

type LoginVariant = 'portal' | 'admin';

type AuthLoginCardProps = {
  variant: LoginVariant;
  eyebrow: string;
  title: string;
  description: string;
  submitLabel: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  backTo: string;
  backLabel: string;
  helperTitle: string;
  helperText: string;
  helperItems: string[];
  forgotTo?: string;
  resetToken?: string | null;
  activationToken?: string | null;
  onSubmitValid?: (values: { email: string; password: string; remember: boolean }) => Promise<void> | void;
  onForgotPassword?: (email: string) => Promise<string>;
  onResetPassword?: (password: string, token: string) => Promise<string>;
  onActivateAccount?: (password: string, token: string, remember: boolean) => Promise<string>;
};

const variantStyles = {
  portal: {
    shell: 'bg-gradient-to-br from-cyan-950 via-slate-950 to-cyan-800',
    badge: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
    icon: 'bg-cyan-700 text-white',
    focus: 'focus:border-cyan-700 focus:ring-cyan-700/15',
    button: 'bg-cyan-700 hover:bg-cyan-800 focus-visible:ring-cyan-300',
    panel: 'from-cyan-700 to-cyan-500',
  },
  admin: {
    shell: 'bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950',
    badge: 'bg-slate-100 text-slate-800 ring-slate-200',
    icon: 'bg-slate-900 text-white',
    focus: 'focus:border-slate-900 focus:ring-slate-900/15',
    button: 'bg-slate-950 hover:bg-slate-800 focus-visible:ring-slate-300',
    panel: 'from-slate-900 to-cyan-800',
  },
} as const;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthLoginCard({
  variant,
  eyebrow,
  title,
  description,
  submitLabel,
  emailPlaceholder,
  passwordPlaceholder,
  backTo,
  backLabel,
  helperTitle,
  helperText,
  helperItems,
  forgotTo,
  onSubmitValid,
  onForgotPassword,
  onResetPassword,
  onActivateAccount,
  resetToken,
  activationToken,
}: AuthLoginCardProps) {
  const styles = variantStyles[variant];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset' | 'activate'>(activationToken ? 'activate' : resetToken ? 'reset' : 'login');

  const emailError = !email.trim()
    ? 'Informe seu e-mail.'
    : !validateEmail(email)
      ? 'Digite um e-mail válido.'
      : '';
  const passwordError = !password
    ? 'Informe sua senha.'
    : password.length < ((mode === 'reset' || mode === 'activate') ? 8 : 6)
      ? (mode === 'reset' || mode === 'activate')
        ? 'A nova senha precisa ter pelo menos 8 caracteres.'
        : 'A senha precisa ter pelo menos 6 caracteres.'
      : (mode === 'reset' || mode === 'activate') && (!/[A-Za-z]/.test(password) || !/\d/.test(password))
        ? 'A nova senha precisa conter letras e números.'
        : '';
  const hasErrors = mode === 'forgot'
    ? Boolean(emailError)
    : (mode === 'activate' || mode === 'reset')
      ? Boolean(passwordError)
      : Boolean(emailError || passwordError);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const message = await onForgotPassword?.(email.trim());
        setSuccessMessage(message || 'Se o e-mail estiver cadastrado, enviaremos as instruções.');
        return;
      }

      if (mode === 'reset') {
        const message = await onResetPassword?.(password, resetToken || '');
        setSuccessMessage(message || 'Senha redefinida com sucesso.');
        setPassword('');
        setMode('login');
        return;
      }

      if (mode === 'activate') {
        const message = await onActivateAccount?.(password, activationToken || '', remember);
        setSuccessMessage(message || 'Conta ativada com sucesso. Redirecionando...');
        return;
      }

      await onSubmitValid?.({ email: email.trim(), password, remember });
      setSuccessMessage('Acesso autorizado. Redirecionando...');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível concluir a solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordVisible = mode !== 'forgot';
  const isEmailVisible = mode !== 'activate' && mode !== 'reset';
  const isRememberVisible = mode === 'login' || mode === 'activate';
  const currentSubmitLabel = mode === 'forgot'
    ? 'Enviar instruções'
    : mode === 'reset'
      ? 'Redefinir senha'
      : mode === 'activate'
        ? 'Ativar conta'
        : submitLabel;

  return (
    <main className={`min-h-screen px-4 py-10 text-slate-950 ${styles.shell}`}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className={`hidden bg-gradient-to-br ${styles.panel} p-10 text-white lg:flex lg:flex-col lg:justify-between`}>
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
                  <img src={logoAnjos} alt={env.orgName} className="h-10 w-auto object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/75">{env.orgName}</p>
                  <p className="text-lg font-bold">Acesso seguro</p>
                </div>
              </div>

              <div className="mt-16 max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-tight text-white">{helperTitle}</h2>
                <p className="mt-5 text-base leading-relaxed text-white/80">{helperText}</p>
              </div>
            </div>

            <div className="space-y-3">
              {helperItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 flex-none" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="p-6 sm:p-10 lg:p-12">
            <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyan-700">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>

            <div className="mt-8 flex items-center gap-3 lg:hidden">
              <img src={logoAnjos} alt={env.orgName} className="h-12 w-auto object-contain" />
              <div>
                <p className="text-sm font-semibold text-slate-500">{env.orgName}</p>
                <p className="font-bold text-slate-950">Acesso seguro</p>
              </div>
            </div>

            <div className="mt-8 max-w-md">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${styles.badge}`}>
                {variant === 'admin' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                {eyebrow}
              </span>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">{mode === 'forgot' ? 'Recuperar senha' : mode === 'activate' ? 'Ativar sua conta' : mode === 'reset' ? 'Criar nova senha' : title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{mode === 'forgot' ? 'Informe seu e-mail para receber instruções de recuperação.' : mode === 'activate' ? 'Crie sua senha de acesso ao portal com pelo menos 8 caracteres, letras e números.' : mode === 'reset' ? 'Digite uma nova senha com pelo menos 8 caracteres, letras e números.' : description}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5" noValidate>
              {isEmailVisible && (
                <label className="block">
                <span className="text-sm font-semibold text-slate-700">E-mail</span>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${submitted && emailError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : `border-slate-200 ${styles.focus}`}`}
                    placeholder={emailPlaceholder}
                    type="email"
                    autoComplete="email"
                    aria-invalid={submitted && Boolean(emailError)}
                  />
                </div>
                {submitted && emailError && <FieldError message={emailError} />}
              </label>
              )}

              {isPasswordVisible && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{mode === 'activate' ? 'Senha de acesso' : mode === 'reset' ? 'Nova senha' : 'Senha'}</span>
                  <div className="relative mt-2">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={`w-full rounded-lg border bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:ring-4 ${submitted && passwordError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : `border-slate-200 ${styles.focus}`}`}
                      placeholder={mode === 'activate' ? 'Crie sua senha' : mode === 'reset' ? 'Digite a nova senha' : passwordPlaceholder}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={(mode === 'reset' || mode === 'activate') ? 'new-password' : 'current-password'}
                      aria-invalid={submitted && Boolean(passwordError)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {submitted && passwordError && <FieldError message={passwordError} />}
                </label>
              )}

              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                {isRememberVisible && (
                  <label className="inline-flex items-center gap-2 font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-cyan-700"
                    />
                    Manter acesso lembrado
                  </label>
                )}
                {forgotTo && mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setSubmitted(false);
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                  >
                    Esqueci minha senha
                  </button>
                )}
                {mode !== 'login' && mode !== 'activate' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setSubmitted(false);
                      setSuccessMessage('');
                      setErrorMessage('');
                    }}
                    className="font-semibold text-cyan-700 transition hover:text-cyan-800"
                  >
                    Voltar ao login
                  </button>
                )}
              </div>

              {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold !text-white shadow-lg transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${styles.button}`}
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                {isSubmitting ? 'Aguarde...' : currentSubmitLabel}
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {message}
    </p>
  );
}
