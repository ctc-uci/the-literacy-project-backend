const { Router } = require('express');
const { pool } = require('../server/db');
const { isNumeric, isAlphaNumeric, isPhoneNumber, isNanoId, keysToCamel } = require('./utils');
const firebaseAdmin = require('../firebase');

const router = Router();

const getAdmins = (allAdmins) =>
  `SELECT *
  FROM tlp_user
  WHERE ${allAdmins ? '' : 'user_id = $1 AND '} position = 'admin';`;

// get admin by id
router.get('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Admin Id must be a Number');
    const admin = await pool.query(getAdmins(false), [adminId]);
    res.status(200).send(keysToCamel(admin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all admin
router.get('/', async (req, res) => {
  try {
    const allAdmins = await pool.query(getAdmins(true));
    res.status(200).json(keysToCamel(allAdmins.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create an admin
router.post('/', async (req, res) => {
  try {
    const { firebaseId, firstName, lastName, phoneNumber, email, inviteId } = req.body;
    isAlphaNumeric(firebaseId, 'Firebase ID must be AlphaNumeric');
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    isNanoId(inviteId, 'Invalid Invite Id Format');
    const newAdmin = await pool.query(
      `INSERT INTO tlp_user
      (firebase_id, first_name, last_name, phone_number, email, position, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`,
      [
        firebaseId,
        firstName,
        lastName,
        phoneNumber,
        email,
        'admin',
        'active', // verified by default since it was through invite
      ],
    );

    // remove used invite from invites table
    await pool.query(`DELETE FROM invites WHERE invite_id = $1 RETURNING *;`, [inviteId]);
    const addedAdmin = await pool.query(getAdmins(false), [newAdmin.rows[0].user_id]);
    res.status(200).send(keysToCamel(addedAdmin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// updates an admin
router.put('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Admin Id must be a Number');
    const { firstName, lastName, phoneNumber, active } = req.body;
    isPhoneNumber(phoneNumber, 'Invalid Phone Number');
    await pool.query(
      `UPDATE tlp_user
      SET first_name = $1, last_name = $2, phone_number = $3, active = $4
      WHERE user_id = $5`,
      [firstName, lastName, phoneNumber, active, adminId],
    );
    const updatedAdmin = await pool.query(getAdmins(false), [adminId]);
    res.status(200).send(keysToCamel(updatedAdmin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete('/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    isNumeric(adminId, 'Id must be a Number');
    const tlpUser = await pool.query(`SELECT * FROM tlp_user WHERE user_id = $1`, [adminId]);
    await firebaseAdmin.auth().deleteUser(tlpUser.rows[0].firebase_id);
    const deletedAdmin = await pool.query(
      `DELETE FROM tlp_user WHERE user_id = $1
      RETURNING *;`,
      [adminId],
    );
    res.status(200).send(keysToCamel(deletedAdmin.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
