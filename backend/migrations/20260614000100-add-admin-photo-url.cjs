'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS foto_url TEXT;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE admins
      DROP COLUMN IF EXISTS foto_url;
    `);
  },
};
