const { Pool } = require('pg');

const pool = new Pool({
  user: 'tlp',
  password: '',
  host: 'tlp-database.csz9fy7uw72a.us-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
});

module.exports = pool;
