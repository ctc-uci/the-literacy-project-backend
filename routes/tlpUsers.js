const { Router } = require('express');
const { pool, db } = require('../server/db');
const { isAlphaNumeric, isNumeric, isNanoId, isPhoneNumber, keysToCamel } = require('./utils');
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

// get a TLP user by their firebase ID
// master teachers objects also include the number of sites they are in
router.get('/:firebaseId', async (req, res) => {
  try {
    const { firebaseId } = req.params;
    isAlphaNumeric(firebaseId, 'Firebase Id must be AlphaNumeric');
    const user = await pool.query(`SELECT * FROM tlp_user WHERE firebase_id = $1;`, [firebaseId]);
    const userData = user.rows[0];
    if (userData.position === 'master teacher') {
      const numSites = await pool.query(
        `SELECT COUNT(site_id) AS count FROM master_teacher_site_relation WHERE user_id = $1;`,
        [userData.user_id],
      );
      userData.num_sites = numSites.rows[0].count;
    }
    res.status(200).send(keysToCamel(userData));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post('/set-active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    isNumeric(userId, 'User ID must be a number');
    const user = await pool.query(
      `UPDATE tlp_user
      SET active = 'active'
      WHERE user_id = $1;`,
      [userId],
    );
    res.status(200).send(keysToCamel(user));
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
// if an old email was given, update the invite linked to that email instead
router.post('/new-invite', async (req, res) => {
  try {
    const { inviteId, email, position, firstName, lastName, phoneNumber, notes, oldInviteId } =
      req.body;
    isNanoId(inviteId, 'Invalid Invite Id Format for Invite Id');
    isNanoId(oldInviteId, 'Invalid Invite Id Format for Old Invite');
    if (phoneNumber) {
      isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    }
    // do not allow user to create an account if there's an existing account
    // delete existing invite if it uses the same email
    const existingEmail = await pool.query(`SELECT * FROM tlp_user WHERE email = $1`, [email]);
    if (existingEmail.rows.length > 0) {
      throw new Error('There is already an existing account with that email.');
    }

    // if the request is not changing an old invite, assume request wants to override
    // any existing invite that overlap with given email
    if (oldInviteId) {
      // check to see if there is an existing valid invite with given email
      const existingInvite = await pool.query(
        `SELECT * FROM invites WHERE email = $1 AND expire_time > NOW()`,
        [email],
      );
      if (existingInvite.rows.length > 0) {
        throw new Error('There is already an existing pending invite with that email.');
      }
    }

    // removes invite if given an old invite id to remove
    // also removes an non-active invite with the given email
    await db.query(
      `DELETE FROM invites WHERE email = $(email)
      ${oldInviteId ? 'OR invite_id = $(oldInviteId)' : ''}
      RETURNING *;`,
      { email, oldInviteId },
    );

    const invite = await pool.query(
      `INSERT INTO invites VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days', $7, $8) RETURNING *;`,
      [inviteId, email, position, firstName, lastName, phoneNumber, true, notes],
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
