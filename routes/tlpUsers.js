const { Router } = require('express');
const { pool } = require('../server/db');
const { isAlphaNumeric, keysToCamel } = require('./utils');

const router = Router();

// get a TLP user (DB Id, position) by their firebase ID
router.get('/:firebaseId', async (req, res) => {
  try {
    const { firebaseId } = req.params;
    isAlphaNumeric(firebaseId, 'Firebase Id must be AlphaNumeric');
    const user = await pool.query(`SELECT * FROM tlp_user WHERE firebase_id = $1;`, [firebaseId]);
    res.status(200).send(keysToCamel(user.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
