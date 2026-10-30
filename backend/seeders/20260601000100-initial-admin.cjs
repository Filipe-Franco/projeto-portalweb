const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const name = process.env.INITIAL_ADMIN_NAME || 'Admin Sistema';
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn('[seed:admin] INITIAL_ADMIN_EMAIL ou INITIAL_ADMIN_PASSWORD ausente. Seed ignorado.');
      return;
    }

    if (password.length < 8) {
      throw new Error('INITIAL_ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await queryInterface.sequelize.query(
      `
        INSERT INTO admins (nome, email, senha_hash, ativo)
        VALUES (:name, LOWER(:email), :passwordHash, TRUE)
        ON CONFLICT (email) DO UPDATE
        SET nome = EXCLUDED.nome,
            senha_hash = EXCLUDED.senha_hash,
            ativo = TRUE,
            atualizado_em = NOW();
      `,
      {
        replacements: {
          name,
          email,
          passwordHash,
        },
      },
    );
  },

  async down(queryInterface) {
    const email = process.env.INITIAL_ADMIN_EMAIL;

    if (!email) {
      return;
    }

    await queryInterface.sequelize.query(
      `
        DELETE FROM admins
        WHERE LOWER(email) = LOWER(:email);
      `,
      {
        replacements: { email },
      },
    );
  },
};
