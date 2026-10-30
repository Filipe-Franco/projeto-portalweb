import { useNavigate, useSearchParams } from 'react-router-dom';

import { AuthLoginCard } from '@/shared/components/app/AuthLoginCard';
import { ApiError } from '@/shared/api/client';
import { loginAdmin, requestPasswordReset, resetPassword } from '@/features/auth/authApi';
import { saveAuthSession } from '@/features/auth/authSession';

function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível autenticar agora. Tente novamente em instantes.';
}

export function LoginAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken');

  return (
    <AuthLoginCard
      variant="admin"
      eyebrow="Painel administrativo"
      title="Acesso da administração"
      description="Entre com suas credenciais administrativas para gerenciar voluntários, eventos, conteúdo público, doações e registros internos."
      submitLabel="Acessar painel"
      emailPlaceholder="Digite seu e-mail de admin"
      passwordPlaceholder="Senha administrativa"
      backTo="/"
      backLabel="Voltar ao site público"
      helperTitle="Gestão central do portal"
      helperText="Ambiente reservado para organização das ações, revisão de cadastros e manutenção dos conteúdos do projeto."
      helperItems={[
        'Aprovação e acompanhamento de voluntários',
        'Gestão de eventos, doações e galeria',
        'Controle de comunicados, CMS e logs',
      ]}
      forgotTo="/admin/login"
      resetToken={resetToken}
      onForgotPassword={async (email) => {
        try {
          const response = await requestPasswordReset('admin', email);
          return response.message;
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
      onResetPassword={async (password, token) => {
        try {
          const response = await resetPassword('admin', token, password);
          return response.message;
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
      onSubmitValid={async ({ email, password, remember }) => {
        try {
          const session = await loginAdmin({ email, senha: password });
          saveAuthSession(session, remember);
          navigate('/admin/dashboard');
        } catch (error) {
          throw new Error(authErrorMessage(error), { cause: error });
        }
      }}
    />
  );
}
