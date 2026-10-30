'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE locais_doacao
        ADD COLUMN IF NOT EXISTS exibir_home BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS ordem_home INTEGER NOT NULL DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_locais_doacao_home
        ON locais_doacao(exibir_home, ativo, ordem_home);

      UPDATE locais_doacao
      SET exibir_home = TRUE,
          ordem_home = 1
      WHERE nome = 'Base Anjos da Madrugada';

      UPDATE locais_doacao
      SET exibir_home = TRUE,
          ordem_home = 2
      WHERE nome = 'Centro Comunitário Parceiro';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_locais_doacao_home;

      ALTER TABLE locais_doacao
        DROP COLUMN IF EXISTS ordem_home,
        DROP COLUMN IF EXISTS exibir_home;
    `);
  },
};
