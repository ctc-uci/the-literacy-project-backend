const { Pool } = require('pg');

const pool = new Pool({
  user: 'joshuachan',
  password: '',
  host: 'localhost',
  port: 5432,
  database: 'postgres',
});

module.exports = pool;
