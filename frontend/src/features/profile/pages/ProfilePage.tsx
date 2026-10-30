import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, KeyRound, Save, User } from 'lucide-react';

import type { AuthRole } from '@/features/auth/authApi';
import { updateAuthUser } from '@/features/auth/authSession';
import { ApiError } from '@/shared/api/client';
import { changeProfilePassword, fetchProfilePhoto, getProfile, updateProfile, uploadProfilePhoto, type Profile } from '@/features/profile/api/profileApi';

type ProfilePageProps = {
  role: AuthRole;
};

type ProfileForm = {
  nome: string;
  email: string;
  telefone: string;
};

type PasswordForm = {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
};

function apiMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Não foi possível concluir a solicitação.';
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function ProfilePage({ role }: ProfilePageProps) {
  const isAdmin = role === 'admin';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({ nome: '', email: '', telefone: '' });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const title = isAdmin ? 'Meu perfil administrativo' : 'Meu perfil';
  const subtitle = isAdmin
    ? 'Atualize seus dados de acesso e preferências da conta administrativa.'
    : 'Mantenha seus dados atualizados para a equipe entrar em contato quando necessário.';
  const accent = isAdmin ? 'bg-slate-950 hover:bg-slate-800' : 'bg-cyan-700 hover:bg-cyan-800';
  const avatarBg = isAdmin ? 'bg-slate-100 text-slate-500' : 'bg-cyan-50 text-cyan-700';

  const initials = useMemo(() => {
    return (profile?.nome || form.nome || 'Usuário')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [form.nome, profile?.nome]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getProfile(role);
        if (!active) return;
        setProfile(response.data);
        setForm({ nome: response.data.nome, email: response.data.email, telefone: response.data.telefone || '' });
        if (response.data.foto_url) {
          objectUrl = await fetchProfilePhoto(role);
          if (active) setPhotoUrl(objectUrl);
        }
      } catch (err) {
        if (active) setError(apiMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [role]);

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);
    try {
      const response = await updateProfile(role, form);
      setProfile(response.data);
      setForm({ nome: response.data.nome, email: response.data.email, telefone: response.data.telefone || '' });
      updateAuthUser({ nome: response.data.nome, email: response.data.email });
      setMessage(response.message || 'Perfil atualizado.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setError('A confirmação da nova senha não confere.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await changeProfilePassword(role, {
        senhaAtual: passwordForm.senhaAtual,
        novaSenha: passwordForm.novaSenha,
      });
      setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setMessage(response.message || 'Senha alterada.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setMessage('');
    setError('');
    setIsUploadingPhoto(true);
    try {
      const data = await fileToDataUrl(file);
      const response = await uploadProfilePhoto(role, { fileName: file.name, mimeType: file.type, data });
      setProfile(response.data);
      const nextPhoto = await fetchProfilePhoto(role);
      setPhotoUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextPhoto;
      });
      setMessage(response.message || 'Foto atualizada.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Conta</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{subtitle}</p>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className={`flex h-36 w-36 items-center justify-center overflow-hidden rounded-full ${avatarBg}`}>
              {photoUrl ? (
                <img src={photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : initials ? (
                <span className="text-4xl font-extrabold">{initials}</span>
              ) : (
                <User className="h-16 w-16" aria-hidden="true" />
              )}
            </div>
            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Camera className="h-4 w-4" aria-hidden="true" />
              {isUploadingPhoto ? 'Enviando...' : 'Alterar foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isUploadingPhoto} onChange={handlePhotoChange} />
            </label>
            <p className="mt-3 text-xs text-slate-500">JPG, PNG ou WEBP até 2MB.</p>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-950">Dados da conta</h2>
            <form onSubmit={handleProfileSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Nome</span>
                <input name="nome" value={form.nome} onChange={handleProfileChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">E-mail</span>
                <input type="email" name="email" value={form.email} onChange={handleProfileChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
              </label>
              {!isAdmin && (
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Telefone</span>
                  <input name="telefone" value={form.telefone} onChange={handleProfileChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                </label>
              )}
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSaving} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-70 ${accent}`}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? 'Salvando...' : 'Salvar dados'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><KeyRound className="h-5 w-5" />Alterar senha</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Senha atual</span>
                <input type="password" name="senhaAtual" value={passwordForm.senhaAtual} onChange={handlePasswordChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Nova senha</span>
                <input type="password" name="novaSenha" value={passwordForm.novaSenha} onChange={handlePasswordChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Confirmar senha</span>
                <input type="password" name="confirmarSenha" value={passwordForm.confirmarSenha} onChange={handlePasswordChange} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
              </label>
              <div className="sm:col-span-3">
                <button type="submit" disabled={isSaving} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-70 ${accent}`}>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? 'Alterando...' : 'Alterar senha'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
