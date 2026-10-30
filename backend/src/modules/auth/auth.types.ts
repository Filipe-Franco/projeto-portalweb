export type AuthRole = 'admin' | 'voluntario';

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  role: AuthRole;
};

export type LoginPayload = {
  email?: unknown;
  senha?: unknown;
  password?: unknown;
};

export type ForgotPasswordPayload = {
  email?: unknown;
};

export type ResetPasswordPayload = {
  token?: unknown;
  senha?: unknown;
  password?: unknown;
};

export type ActivateAccountPayload = {
  token?: unknown;
  senha?: unknown;
  password?: unknown;
};

export type TokenPayload = {
  sub: string;
  role: AuthRole;
  email: string;
};
