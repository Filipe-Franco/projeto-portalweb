'use strict';

const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(
  __dirname,
  '..',
  '..',
  'database',
  'schema_postgres_anjos_da_madrugada.sql',
);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await queryInterface.sequelize.query(schemaSql);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS logs_admin CASCADE;
      DROP TABLE IF EXISTS notificacoes_email CASCADE;
      DROP TABLE IF EXISTS uploads_voluntarios CASCADE;
      DROP TABLE IF EXISTS equipe CASCADE;
      DROP TABLE IF EXISTS conteudo CASCADE;
      DROP TABLE IF EXISTS faq CASCADE;
      DROP TABLE IF EXISTS galeria CASCADE;
      DROP TABLE IF EXISTS locais_doacao CASCADE;
      DROP TABLE IF EXISTS doacoes CASCADE;
      DROP TABLE IF EXISTS historico_acoes CASCADE;
      DROP TABLE IF EXISTS materiais CASCADE;
      DROP TABLE IF EXISTS comunicado_leituras CASCADE;
      DROP TABLE IF EXISTS comunicados CASCADE;
      DROP TABLE IF EXISTS evento_presencas CASCADE;
      DROP TABLE IF EXISTS eventos CASCADE;
      DROP TABLE IF EXISTS voluntario_areas CASCADE;
      DROP TABLE IF EXISTS areas_interesse CASCADE;
      DROP TABLE IF EXISTS voluntarios CASCADE;
      DROP TABLE IF EXISTS admins CASCADE;

      DROP TYPE IF EXISTS status_upload_voluntario CASCADE;
      DROP TYPE IF EXISTS tipo_upload_voluntario CASCADE;
      DROP TYPE IF EXISTS tipo_conteudo CASCADE;
      DROP TYPE IF EXISTS tipo_material CASCADE;
      DROP TYPE IF EXISTS status_notificacao CASCADE;
      DROP TYPE IF EXISTS categoria_faq CASCADE;
      DROP TYPE IF EXISTS status_imagem CASCADE;
      DROP TYPE IF EXISTS tipo_doacao CASCADE;
      DROP TYPE IF EXISTS status_presenca CASCADE;
      DROP TYPE IF EXISTS tipo_evento CASCADE;
      DROP TYPE IF EXISTS status_voluntario CASCADE;
      DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
    `);
  },
};
