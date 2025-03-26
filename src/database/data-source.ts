import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * 터미널 명령어 정리: 
 * typeorm migration:create ./src/database/migrations/test   
 * pnpm build
 * typeorm migration:run -d ./dist/database/data-source.js   
 * typeorm migration:revert -d ./dist/database/data-source.js
 */
export default new DataSource({
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5555'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  logging: false,
  entities: [
    'dist/**/*.entity.js'
  ],
  migrations: [
    'dist/database/migrations/*.js'
  ],
  ...(process.env.ENV === 'prod' && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});