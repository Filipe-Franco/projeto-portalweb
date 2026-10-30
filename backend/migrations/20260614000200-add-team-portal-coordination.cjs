'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE equipe
      ADD COLUMN IF NOT EXISTS exibir_portal BOOLEAN NOT NULL DEFAULT FALSE;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE equipe
      DROP COLUMN IF EXISTS exibir_portal;
    `);
  },
};
