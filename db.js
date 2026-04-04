const { Pool } = require('pg');
require('dotenv').config();

// For Vercel/Neon we'll check POSTGRES_URL or DATABASE_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false } // Required for Vercel/Neon
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

pool.connect()
  .then(() => console.log('Connected to PostgreSQL successfully.'))
  .catch((err) => console.error('Error connecting to PostgreSQL:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
};
