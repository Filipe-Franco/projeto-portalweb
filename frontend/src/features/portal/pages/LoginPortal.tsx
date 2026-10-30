import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthLoginCard } from '@/shared/components/app/AuthLoginCard';
import { ApiError } from '@/shared/api/client';
import { activateVolunteerAccount, loginVolunteer, requestPasswordReset, resetPassword } from '@/features/auth/authApi';
import { saveAuthSession } from '@/features/auth/authSession';

function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível autenticar agora. Tente novamente em instantes.';
}

export function LoginPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken');
  const activationToken = searchParams.get('activationToken');

  return (
    <AuthLoginCard
      variant="portal"
      eyebrow="Portal do voluntário"
      title="Entre para acompanhar suas ações"
      description="Use o e-mail aprovado pela administração para acessar eventos internos, comunicados, materiais e histórico de participação."
      submitLabel="Acessar portal"
      emailPlaceholder="Digite o seu e-mail de voluntário"
      passwordPlaceholder="Digite sua senha"
      backTo="/"
      backLabel="Voltar ao portal público"
      helperTitle="Sua área de apoio às ações da madrugada"
      helperText="Aqui o voluntário encontra informações importantes para participar com organização, segurança e cuidado."
      helperItems={[
        'Eventos e confirmações de presença',
        'Comunicados oficiais da equipe',
        'Materiais e histórico de participação',
      ]}
      forgotTo="/portal/login"
      resetToken={resetToken}
      activationToken={activationToken}
      onForgotPassword={async (email) => {
        try {
          const response = await requestPasswordReset('voluntario', email);
          return response.message;
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
      onResetPassword={async (password, token) => {
        try {
          const response = await resetPassword('voluntario', token, password);
          return response.message;
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
      onActivateAccount={async (password, token, remember) => {
        try {
          const session = await activateVolunteerAccount(token, password);
          saveAuthSession(session, remember);
          navigate('/portal');
          return session.message;
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
      onSubmitValid={async ({ email, password, remember }) => {
        try {
          const session = await loginVolunteer({ email, senha: password });
          saveAuthSession(session, remember);
          navigate('/portal');
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
    />
  );
}
