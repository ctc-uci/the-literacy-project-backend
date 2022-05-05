const { Router } = require('express');
const { pool } = require('../server/db');
const { isAlphaNumeric, isNanoId, isPhoneNumber, keysToCamel } = require('./utils');
const admin = require('../firebase');

const router = Router();

// This gets all invites from the invite table
router.get('/invite', async (req, res) => {
  try {
    const invites = await pool.query(
      'SELECT * FROM invites WHERE valid_invite = true AND NOW() < expire_time;',
    );
    res.status(200).json(keysToCamel(invites.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

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
// if given email is already associated with an existing account, return an error
// if given email has a current invite, existing invite is overwritten and new invite is added
router.post('/new-invite', async (req, res) => {
  try {
    const { inviteId, email, position, firstName, lastName, phoneNumber } = req.body;
    isNanoId(inviteId, 'Invalid Invite Id Format');
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');

    // do not allow user to create an account if there's an existing account
    // delete existing invite if it uses the same email
    const existingEmail = await pool.query(`SELECT * FROM tlp_user WHERE email = $1`, [email]);
    if (existingEmail.rows.length > 0) {
      throw new Error('There is already an existing account with that email.');
    }

    await pool.query(`DELETE FROM invites WHERE email = $1 RETURNING *;`, [email]);

    const invite = await pool.query(
      `INSERT INTO invites VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days', $7) RETURNING *;`,
      [inviteId, email, position, firstName, lastName, phoneNumber, true],
    );
    res.status(200).send(keysToCamel(invite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// invite ID should be guaranteed to be valid when calling this route
// creates Firebase account with email and password and set email verified to true
// returns all necessary data to create account in respective tables for admin and master teacher
router.post('/complete-creation', async (req, res) => {
  try {
    const { inviteId, password } = req.body;
    isNanoId(inviteId, 'Invalid Invite Id Format');
    const invitedUser = await pool.query(
      `SELECT * FROM invites WHERE invite_id = $1 AND valid_invite = true AND NOW() < expire_time;`,
      [inviteId],
    );
    const invite = invitedUser.rows[0];
    const newUserInfo = keysToCamel(invite);

    const user = await admin.auth().createUser({
      email: newUserInfo.email,
      emailVerified: true,
      password,
    });

    newUserInfo.firebaseId = user.uid;

    res.status(200).send(keysToCamel(newUserInfo));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete('/invite/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;
    isNanoId(inviteId, 'Invalid Invite Id Format');

    const deletedInvite = await pool.query(`DELETE FROM invites WHERE invite_id = $1`, [inviteId]);

    res.status(200).send(keysToCamel(deletedInvite.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
