import 'dotenv/config';
import { DataSource } from 'typeorm';

const compiled = __filename.endsWith('.js');
const root = compiled ? 'dist' : 'src';
const ext = compiled ? 'js' : 'ts';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    `${root}/modules/**/infrastructure/typeorm/entities/*.entity.${ext}`,
  ],
  migrations: [`${root}/migrations/*.${ext}`],
});
