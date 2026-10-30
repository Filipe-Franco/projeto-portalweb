require('dotenv').config();

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://portal_user:portal_pass@localhost:5433/portalweb';

const baseConfig = {
  url: databaseUrl,
  dialect: 'postgres',
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
  dialectOptions:
    process.env.DB_SSL === 'true'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    logging: false,
  },
  production: {
    ...baseConfig,
    logging: false,
  },
};
