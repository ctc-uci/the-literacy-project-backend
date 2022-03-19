const { Router } = require('express');
const { pool } = require('../server/db');
const { isAlphaNumeric, isNanoId, keysToCamel } = require('./utils');
const admin = require('../firebase');

const router = Router();

// get a TLP user (DB Id, position, active) by their firebase ID
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

// return the data if there is a valid invite, else returns empty data
router.get('/invite/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;
    isNanoId(inviteId, 'Invite Id must be a NanoId');
    const invite = await pool.query(
      `SELECT * FROM invites WHERE invite_id = $1 AND valid_invite = true AND NOW() < expire_time;`,
      [inviteId],
    );
    res.status(200).send(keysToCamel(invite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// add a new invite into the invite table for the TLP user
router.post('/new-invite', async (req, res) => {
  try {
    const { inviteId, firebaseId } = req.body;
    isNanoId(inviteId, 'Invite Id must be a NanoId');
    const invite = await pool.query(
      `INSERT INTO invites VALUES ($1, $2, NOW() + INTERVAL '7 days', $3) RETURNING *;`,
      [inviteId, firebaseId, true],
    );
    res.status(200).send(keysToCamel(invite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// invite ID should be guaranteed to be valid when calling this route
// update the password for the user and remove invite from invites table
// also update status to active
router.post('/complete-creation', async (req, res) => {
  try {
    const { inviteId, password } = req.body;
    isNanoId(inviteId, 'Invite Id must be a NanoId');
    // get firebase id from invites to update password
    const user = await pool.query(
      `SELECT * FROM invites WHERE invite_id = $1 AND valid_invite = true AND NOW() < expire_time;`,
      [inviteId],
    );
    const firebaseId = user.rows[0].firebase_id;
    await admin.auth().updateUser(firebaseId, {
      emailVerified: true,
      password,
    });

    // update status to active
    await pool.query(
      `UPDATE tlp_user
      SET active = 'active'
      WHERE firebase_id = $1
      RETURNING *;`,
      [firebaseId],
    );

    // remove used invite from invites table
    const deletedInvite = await pool.query(
      `DELETE FROM invites WHERE invite_id = $1 RETURNING *;`,
      [inviteId],
    );

    res.status(200).send(keysToCamel(deletedInvite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
