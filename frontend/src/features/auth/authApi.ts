import { apiPost } from '@/shared/api/client';

export type AuthRole = 'admin' | 'voluntario';

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  role: AuthRole;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type ActivateVolunteerResponse = LoginResponse & {
  message: string;
};

export function loginAdmin(payload: { email: string; senha: string }) {
  return apiPost<LoginResponse>('/admin/auth/login', payload);
}

export function loginVolunteer(payload: { email: string; senha: string }) {
  return apiPost<LoginResponse>('/portal/auth/login', payload);
}

export function requestPasswordReset(role: AuthRole, email: string) {
  const path = role === 'admin' ? '/admin/auth/esqueci-senha' : '/portal/auth/esqueci-senha';
  return apiPost<ForgotPasswordResponse>(path, { email });
}

export function resetPassword(role: AuthRole, token: string, senha: string) {
  const path = role === 'admin' ? '/admin/auth/redefinir-senha' : '/portal/auth/redefinir-senha';
  return apiPost<ResetPasswordResponse>(path, { token, senha });
}


export function activateVolunteerAccount(token: string, senha: string) {
  return apiPost<ActivateVolunteerResponse>('/portal/auth/ativar-conta', { token, senha });
}
