const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.AWS_USER,
  password: process.env.AWS_PASSWORD,
  host: process.env.AWS_HOST,
  port: process.env.AWS_PORT,
  database: process.env.AWS_DATABASE,
});

module.exports = pool;
