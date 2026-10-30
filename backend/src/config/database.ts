import { Sequelize } from 'sequelize';

import { env, isProduction } from './env.js';

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
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
});

export async function assertDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[database] connection established');
  } catch (error) {
    console.error('[database] connection failed');
    if (!isProduction) {
      console.error(error);
    }
    throw error;
  }
}
