const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const name = process.env.TEST_VOLUNTEER_NAME || 'Voluntário Teste';
    const email = process.env.TEST_VOLUNTEER_EMAIL;
    const password = process.env.TEST_VOLUNTEER_PASSWORD;
    const phone = process.env.TEST_VOLUNTEER_PHONE || '51999999999';

    if (!email || !password) {
      console.warn('[seed:volunteer] TEST_VOLUNTEER_EMAIL ou TEST_VOLUNTEER_PASSWORD ausente. Seed ignorado.');
      return;
    }

    if (password.length < 8) {
      throw new Error('TEST_VOLUNTEER_PASSWORD precisa ter pelo menos 8 caracteres.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await queryInterface.sequelize.query(
      `
        INSERT INTO voluntarios (
          nome,
          email,
          telefone,
          mensagem,
          senha_hash,
          status,
          convite_token,
          convite_token_exp,
          reset_token,
          reset_token_exp,
          tentativas_login,
          bloqueado_ate,
          aprovado_em
        )
        VALUES (
          :name,
          LOWER(:email),
          :phone,
          'Voluntário de teste criado por seed para validar o login do portal.',
          :passwordHash,
          'aprovado',
          NULL,
          NULL,
          NULL,
          NULL,
          0,
          NULL,
          NOW()
        )
        ON CONFLICT (email) DO UPDATE
        SET nome = EXCLUDED.nome,
            telefone = EXCLUDED.telefone,
            mensagem = EXCLUDED.mensagem,
            senha_hash = EXCLUDED.senha_hash,
            status = 'aprovado',
            convite_token = NULL,
            convite_token_exp = NULL,
            reset_token = NULL,
            reset_token_exp = NULL,
            tentativas_login = 0,
            bloqueado_ate = NULL,
            aprovado_em = COALESCE(voluntarios.aprovado_em, NOW()),
            atualizado_em = NOW();
      `,
      {
        replacements: {
          name,
          email,
          phone,
          passwordHash,
        },
      },
    );
  },

  async down(queryInterface) {
    const email = process.env.TEST_VOLUNTEER_EMAIL;

    if (!email) {
      return;
    }

    await queryInterface.sequelize.query(
      `
        DELETE FROM voluntarios
        WHERE LOWER(email) = LOWER(:email);
      `,
      {
        replacements: { email },
      },
    );
  },
};
